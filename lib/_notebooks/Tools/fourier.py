# -*- coding: utf-8 -*-
"""
fourier

Tools.fourier contains custom methods for performing fourier analysis on signals.

@author: khris
"""

### Dependencies
import Tools.utils
import numpy as np
from numpy.fft import fft, ifft, fftfreq
from math import ceil, log, floor
from scipy.signal import hilbert



### Helper functions
def nextpow2(num):
  return ceil(log(abs(num),2))


'''
FFT

This function takes a signal, dat, and computes the magnitude sprectrum by hilbert*
transform, mean subtraction*, and padding to the next power of 2 length*.

if truncateOutput = True, only the magnitudes are returned, otherwise a dict 
containing the original signal, the hilbert signal, the Fourier Stectrum, the 
Magnitude Spectrum, the frequencies vector and the amount of padding.

* = optional, see defaults
'''
def FFT(
    dat, 
    Fs = None, 
    nyquist = None, 
    deMean = False, 
    doHilbert = True,
    truncateOutput = False,
    doPad = True,
    padPow2Ext= 1,
    keepRaw = False
  ):

  raw = np.array(dat).copy()
  if Fs is None:
    Fs = float(1) #
  if nyquist is None:
    nyquist = float(Fs) / 2
  if deMean:
    theMean = np.mean(raw)
    dat = raw - theMean
  if doHilbert:
    dat = hilbert(dat)
  # Increase fft efficiency
  nData = np.shape(dat)[-1]
  if doPad:
    nFFT = 2**(nextpow2(nData)+padPow2Ext)
    padLengths = [(nFFT - nData)/2] * 2 
    padLengths = [floor(padLengths[0]),ceil(padLengths[1])]
    paddedData = np.zeros(
      nFFT, 
      dtype = np.complex_ if doHilbert or any(np.iscomplex(dat)) else np.float_
    )
    inds = np.arange(0,nData)
    inds[:] += padLengths[0]
    paddedData[inds] = dat
  else:
    nFFT = len(dat)
    paddedData = np.array(dat)
    padLengths = [0,0]
  # Do FFT
  fourierData = fft(paddedData)
  # Compute the magnitudes as U/Hz 
  magnitudes = abs(fourierData[:(nFFT//2 + 1)]/nData)
  phases = np.angle(fourierData[:(nFFT//2 + 1)])
  
  
  
  frequencies = fftfreq(nFFT+1, 1/float(Fs))[:nFFT//2+1] #interval is 1/Fs=sec/cycle
  if keepRaw:
    rawFFTprep = paddedData.copy()
    rawFFTprep[np.arange(0,nData)+padLengths[0]] = raw
    rawFFT = fft(rawFFTprep)
    rawAngles = np.angle(rawFFT[:nFFT//2+1])
    rawMags = np.abs(rawFFT[:(nFFT//2 + 1)]/nData)
    raw = {'data': raw, 'fft': rawFFT, 'angles': rawAngles, 'magnitudes': rawMags}
  else:
    raw = {}
  if truncateOutput:
    output = magnitudes
  else:
    output = {
      "Raw": raw,
      "Analytic": dat,
      "Fourier": fourierData,
      "Magnitudes": magnitudes,
      "Phases": phases,
      "Frequencies": frequencies,
      "Padding": padLengths,
    }
  return output

###

'''
IFFT

This function performs the inverse fourier of a fourier spectrum which has been 
padded. Mostly used to inverse fourier the 'Fourier' output from FFT

'''
def IFFT(fDat, padLengths = None):
  tDat = ifft(fDat)
  if padLengths is not None:
    tDat = tDat[padLengths[0]:(len(tDat)-padLengths[1])]
  return(tDat)


'''
getHarmonics

supply magnitudes and frequencies to find the principal frequency and nHarmonics.

'''
def getHarmonics(
        magnitudes,
        frequencies,
        lookAhead = 0.1, #search window of 10% of length
        shift = 0, #start search window at 0%
        nHarmonics = 5,
        localPeakWindow = 10 #find nearest peak within 10 samples of predicted
    ):
    # Parse
    if lookAhead > 1:
        lookAhead = lookAhead/100
    if shift > 1:
        shift = shift/100
    if shift+lookAhead > 1:
        lookAhead = 1-shift
    if (localPeakWindow % 2):
        #is odd, force to even
        localPeakWindow = 2*localPeakWindow//2
    else:
        localPeakWindow = int(localPeakWindow)
    # Find location of first maximum
    lowMax = max( \
        magnitudes[ \
            int(len(magnitudes)*shift): \
            min([ \
                len(magnitudes), \
                int(len(magnitudes)*lookAhead) \
            ]) \
       ] \
    ) #max
    firstPeak = [pk for pk,lgc in enumerate(magnitudes == lowMax) \
        if lgc][0]
    # Compute nHarmonics
    pkMag = frequencies[firstPeak]
    theHarmonics = [h * pkMag for h in range(1,nHarmonics+1)]
    hLocs = []
    hPkLocs = []
    aMags = []
    for h in theHarmonics:
        hLocs.append(
                [i for i,x in enumerate(frequencies >= h) if x][0]
        )
        theSearchWindow = [ \
           hLocs[-1]+a-localPeakWindow//2 \
           for a in range(localPeakWindow) \
          ]
        correction = np.sum([v < 0 for v in theSearchWindow])
        theSearchWindow = [int(v+correction) for v in theSearchWindow]
        localMax = max(magnitudes[theSearchWindow])
        hPkLocs.append(
            [p+theSearchWindow[0] for p,lg in enumerate(magnitudes[theSearchWindow] == localMax) if lg][0]
        )
        aMags.append(localMax)
    hFreqs = []
    hMags = []
    aFreqs = []
    for loc,alc in zip(hLocs,hPkLocs):
        hMags.append(magnitudes[loc])
        hFreqs.append(frequencies[loc])
        aFreqs.append(frequencies[alc])
        
    return({
        'PredictedFreqs': theHarmonics,
        'NearestFreqs': hFreqs,
        'NearestPeaks': {'Frequency': aFreqs, 'Magnitude': aMags},
        'NearestMags': hMags
    })

###

'''
bootFourier

**kwargs are passed to FFT()

'''
def bootFourier(
        dataVector,
        Fs,
        nBootstraps = 2000,
        bootType = 'perm',
        segmentExponent = 0,
        ciLevel = 99.999,
        **kwargs
    ):
    # Parse Inputs
    bootType = ['perm','rand'][
        [ \
            a for a,s in enumerate(['perm','rand']) \
                if bootType.lower() in s \
        ][0] \
    ]
    replace = False
    if bootType == 'rand':
        replace = True
    if segmentExponent is None:
        segmentSize = 2**nextpow2(len(dataVector))
    else:
        segmentSize = 2**segmentExponent
    # Compute fft
    actualFourier = FFT(
        dat= dataVector,
        Fs = Fs,
        **kwargs
    )
    # Gather info for resampling
    datLength = len(dataVector)
    discrep = (datLength//segmentSize + 1) * \
        segmentSize - datLength
    bootData = np.pad(
        np.array(dataVector),
        (0,discrep),
        mode = 'constant',
        constant_values = (0,0)
    )
    # actual reshape
    bootData = bootData.reshape(
        (segmentSize,-1)
    )
    # bootstrap loop
    bootMagnitudes = []
    for _ in range(nBootstraps):
        resampleIndices = np.random.choice(
            bootData.shape[1],
            replace = replace,
            size = bootData.shape[1]
        )
        bootMagnitudes.append(
            FFT(
                dat= bootData[:,resampleIndices].flatten('F')[:-discrep or None],
                Fs= Fs,
                truncateOutput= True,
                **kwargs
            )
        )
    # Build CI
    # first reshape
    bootMagnitudes = list(zip(*bootMagnitudes))
    # Get percentiles
    CIs = []
    for b in range(len(bootMagnitudes)):
        CIs.append(
            [
                np.percentile(np.array(bootMagnitudes[b]),q=float(100-ciLevel)/2,interpolation='nearest'),
                np.percentile(np.array(bootMagnitudes[b]),q=float(100-ciLevel)/2 + ciLevel,interpolation='nearest')
            ]
        )
    # Reshape for plotting
    outputCIs = list(zip(*CIs)) 
    output = {
        'Actual': actualFourier,
        'CIs': outputCIs
    }
    return output