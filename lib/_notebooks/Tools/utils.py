# -*- coding: utf-8 -*-
"""
utils
Created on Thu Jul  6 22:39:14 2017

@author: khris
"""

# Depends:
import numpy as np
import matplotlib

### FUNCTIONS
class customError(Exception):
  pass
def domain(array, trunc=True):
    if trunc:
        return [np.min(array), np.max(array)]
    return {'low': np.min(array), 'high': np.max(array)}
def nan_helper(dat):
    if not isinstance(dat,np.ndarray):
        dat = np.array(dat)
    return np.isnan(dat), lambda z: z.nonzero()[0]

# Make a list of twinX axes
def multiX(ax,n=2,concatOriginal=False,concatFirst=True):
    twins = [] * (n+concatOriginal)
    for _ in range(n):
        twins.append(ax.twinx())
    if concatOriginal:
        if concatFirst:
            twins = [ax]+twins;
        else:
            twins.append(ax)
    return twins

# UCLA colors
def colorize(name='', opacity=float(1), brightness=float(1), *colVals):
    if opacity > 1.0:
        opacity = 1.0
    if opacity < 0.0:
        opacity = 0.0
    if brightness < 0.0:
        brightness = -1.0/brightness
    if name == 'blue':
        rgb = [50, 132, 191]
    elif name == 'darkblue':
        rgb = [0, 85, 166]
    elif name == 'yellow':
        rgb = [255, 232, 0]
    elif name == 'green':
        rgb = [0, 255, 135]
    elif name == 'cyan':
        rgb = [0, 255, 255]
    elif name == '':
        rgb = [*colVals]
    else:
        rgb = [50, 132, 191] #blue
    rgb = [float(col)*brightness for col in rgb]
    for col in range(3):
        if rgb[col] > 255:
            rgb[col] = float(255)
        elif rgb[col] < 0:
            rgb[col] = float(0)
    rgb *= 1/256
    rgb.append(opacity)
    return tuple(rgb)
            
# Data reshaper with overlap allowed

def datshaper(dat, windowLength, overlap=None, padWith=0):
    '''
    Reshape vectors into windows, padding with 0's rather than truncating.
    Uses the following calculation for nSegments:
    nSegments = (dataLength-overlap)/(windowLength-overlap)
    -------------------------------------------------------------------------###
     Developed by Khris Griffis, 2014.
     Originally developed for MATLAB (2014)
     Adapted to Python3.6 (2017)
    -------------------------------------------------------------------------###
    '''
    # depends
    import numpy as np
    
    ## Handle Inputs
    
    # Make sure we have a numpy array
    if type(dat) is not np.ndarray:
        dat = np.array(dat)
    # Make sure we have integers
    windowLength = int(windowLength)
    # Fix overlap then set as int
    if overlap is None: 
        overlap = 0
    elif (overlap is not None) & windowLength != 2:
        overlap = overlap
    elif (overlap is not None) & overlap > (windowLength-1):
        overlap = windowLength-1 # then set it to maximum overlap
    overlap = int(overlap)
    # determine fill
    if padWith is not int():
        padWith <- int(padWith[0])
    #organize
    if dat.ndim > 1:
        # first check if row vector
        if dat.shape[0] == 1:
            dat = dat.squeeze() # handle if 2nd and 3rd supplied
            if dat.shape[0] == 1:
                dat = dat.transpose()
        # then check if 3d, then fail
        if dat.ndim >= 3:
            raise TypeError('Too many input dimensions, must be <= 2.')
        # If dim is still 2, recurse
        return(np.apply_along_axis(
            datshaper,
            0,
            dat,
            windowLength=windowLength,
            overlap=overlap,
            padWith=padWith
            )
        )
    # Operate on single column vector now
    #Pad with filler if shorter than window
    windowDiff = dat.shape[0]-windowLength
    if windowDiff < 0:
        dat = np.append(dat, np.repeat(padWith, np.abs(windowDiff)))
    #Get info on number of output cols
    dataLength = dat.shape[0]
    K = (dataLength-overlap)/(windowLength-overlap)
    Kl = float(int(K))
    #Pad if uneven number of segments
    if Kl != K:
        Kl = int(Kl+1)
        newLength = int(Kl*(windowLength-overlap)+overlap)
        lengthDiff = np.abs(newLength - dataLength)
        dat = np.append(dat, np.repeat(padWith, np.abs(lengthDiff)))
    else:
        Kl = int(Kl)
    #put data into windowed columns with overlap
    coli = np.repeat(
        np.array(np.arange(Kl)*(windowLength-overlap)),
        windowLength
    )
    rowi = np.repeat(
        np.arange(windowLength).reshape((windowLength,1)),
        Kl,
        axis=1
    ).transpose().reshape((Kl*windowLength,-1))
    return(
        dat[coli+rowi].reshape((Kl,windowLength)).transpose()
    )    


# convert strings to multi-factor or vectors to 
def expandGrid(*vals, doPaste = True, sep = ' ', expansion=None):
    '''
    Takes unnamed inputs and creates a matrix of all possible combinations. Rows of the
    resulting matrix can be pasted together as strings using the provided separator ,sep.
    '''
    if len(vals) == 1:
        return np.array([*vals])
    output = np.array(
        np.meshgrid(*vals)
      ).reshape(len(vals),-1).T
    output = output[output[:,0].argsort(),:]
    if doPaste:
        stringOut = [];
        for row in range(output.shape[0]):
            stringOut.append(sep.join(output[row,:]))
        output = np.array(stringOut)
    
    if expansion is not None:
        print(output.shape[0])
        if (len(expansion) != output.shape[0]):
            import warnings
            warnings.warn('Length of "expansion" must be the same as output.')
            return output
        output = np.repeat(output, expansion, axis=0);
    return output

'''
Validate String

takes an input string and outputs the matching string from an string list.
'''
def validateString(inputString, argList, method=None):
  if method is not None:
    method = validateString(method, ['exact', 'approx'],method= None)
  
  if method == 'exact':
    ind = [a for a,s in enumerate(argList) if inputString.lower() == s.lower()]
  elif method == 'approx':
    ind = [a for a,s in enumerate(argList) if inputString.lower() in s.lower()]
  else:
    #default to approx
    ind = [a for a,s in enumerate(argList) if inputString.lower() in s.lower()]
  try:
    ind = ind[0]
  except IndexError:
    raise customError('Invalid String!')
  return(argList[ind])

'''
wordCalc(name) converts a string to its simplified summation of each of the character values (1-9)
Uses a pythagorean approach
'''
def wordCalc(name):
    #strip whitespace
    allChars = "".join(name.split())
    vals = [(ord(l)-97) %9 +1 for l in allChars.lower()]
    breakdown = " + ".join([str(v) for v in vals])
    total = sum(vals)
    while total > 9:
        breakdown += f" = {total}"
        theStr = str(total)
        iterVals = [int(s) for s in theStr]
        total = sum(iterVals)
        breakdown += " = " + " + ".join([str(v) for v in iterVals])
    return {"breakdown": breakdown + f" = {total}", "Number": total}









