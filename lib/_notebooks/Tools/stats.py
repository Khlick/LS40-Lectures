# -*- coding: utf-8 -*-
"""
statistic tools
Created on Thu Dec  7 09:15:55 2017

@author: khris
"""

# Dependencies
import numpy as np
import scipy.stats as stats
## Custom libraries
import Tools.fourier as fl
import Tools.utils as utils


'''
cor

This function computes the correlation (pearson or spearman) on a matrix or on 
input vectors.
'''

def cor(*data, method='pearson', handleMissing= 'pairwise', **keyArgs):
  # Parse
  method= utils.validateString(method, ['pearson','spearman','kendall'],'approx')
  handleMissing= utils.validateString(handleMissing,['pairwise', 'complete'],'approx')
  
  print('Function in development!')
  return



'''
makeDots()
A function to make dotplots from data. Also, this can be used to generate
density plots with kernel over the top.
'''
def makeDots(data, type='discrete', kdeArgs= {'poolSize':10000}, **histArgs):
    '''
    Calculate a histogram from provided data and
    convert to x,y points for scatter plot.
    Inputs: 
        data= 1D array for histogram
        type= string: 'discrete' [default] or 'continuous'
        density= bool: convert counts to densities
        **histArgs= keyword args for np.histogram() fun
    Output: A dict with keys
        x: x vector
        y: y vector
    '''
    output = {}
    type = utils.validateString(type, ['discrete', 'continuous']);
    if not isinstance(data, np.ndarray):
        data = np.array(data)
    # parse keyword args
    density= histArgs.pop('density',False)
    if type == 'discrete':
        # Compute bin edges and counts
        h= np.histogram(data,**histArgs)
        # Calculate bin centers
        binCenters = np.diff(h[1])/2 + h[1][:-1]
        # create x position vector from bin centers and counts
        xs= np.repeat(binCenters, h[0])
        #init zeros array for y positions
        ys= np.zeros(h[0].sum())
        start= 0
        stop= 0
        for val in h[0]:
            if val:
                stop += val
                ys[start:stop] = np.arange(val)+0.5
                start= stop
        if density:
            db = np.repeat(np.diff(h[1]), h[0])
            ys= ys/db/h[0].sum()
        output.update({'x':xs, 'y':ys})
    elif type == 'continuous':
        np.random.seed(4443451)
        datLen = data.shape[-1]
        h= np.histogram(data,density=True,**histArgs);
        uSize = kdeArgs.pop('poolSize',10*datLen) / 2
        kdeFun= stats.kde.gaussian_kde(data,**kdeArgs)
        h = np.array(h)
        h[0] = np.append(h[0],0)
        yDomain = utils.domain(h[0], trunc=False)
        xDomain = utils.domain(h[1], trunc=False)
        inds = np.array([])
        uFactor = 2
        outlen = 0
        while outlen < datLen:
            uSize *= uFactor
            xUnif = np.random.uniform(**xDomain, size = int(uSize))
            yUnif = np.random.uniform(**yDomain, size = int(uSize))
            for x in range(int(uSize)):
                yUnif[x] = yUnif[x] if yUnif[x] < kdeFun(xUnif[x]) else np.nan
            nans, fn = utils.nan_helper(yUnif)
            inds = fn(~nans);
            outlen = inds.shape[-1]
            
        inds = np.random.choice(inds, replace=False, size=datLen);
        output.update({'x':xUnif[inds], 'y': yUnif[inds], 'kernel': kdeFun})

    return output