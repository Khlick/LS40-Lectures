# -*- coding: utf-8 -*-
"""
statistic tools
Created on Thu Dec  7 09:15:55 2017

@author: khris
"""

# # Dependencies
import numpy as np
import scipy.stats as stats
import pandas as pd
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



'''
linRescale

linear rescaling from a vector or given range to new.
Works on vectors or scalar. scalar requires inputRange
'''
def linRescale(val,newRange,oldRange=None):
    if len(val) == 1 and oldRange is None:
        raise utils.customError('Scalar input requires argument: "oldRange"');
    if oldRange is None:
        oldRange = utils.domain(val);
    if not isinstance(val, np.ndarray):
        val = np.array(val);
    
    return (((val - oldRange[0]) * (newRange[1] - newRange[0])) / (oldRange[1] - oldRange[0])) + newRange[0]


'''
ecdf
Calculate an empirical cdf. Is a function that returns the percentile.
'''
def getQuants(data,returnPercentiles = False):
    # copy the input data
    xd = np.array(data, copy=True);
    # sort the copy
    xd.sort();
    # get the length    
    N = len(xd);
    # calculate  linear spacing
    percents = np.asarray(np.linspace(0.,N,N+1))/N;
    # stick a -Inf at the beginning to offset the percents
    xd = np.asarray(np.insert(xd,0,-np.inf));
    # define a function that searches for the percentiles based on data.
    def searchQuants(getVals):
        # get the index of the value
        inds = np.searchsorted(xd,getVals,'right')-1;
        # return the percent
        return percents[inds]
    if returnPercentiles:
        #only wanted percentiles from the data
        return searchQuants(data)
    #otherwise I want the function so i can use it
    return searchQuants;


'''
expectTable
Get the expected contingency table.
'''
# get expected table
def expectTable(observeTable,axis=0):
    rowSums = observeTable.sum(axis=1);
    colSums = observeTable.sum(axis=0);
    if axis:
        # then we want to fix the cols
        probs = rowSums.T / np.sum(rowSums);
        prod = colSums.T;
    else:
        probs = colSums / np.sum(colSums);
        prod = rowSums;
    return pd.DataFrame(np.outer(prod,probs), index=observeTable.index, columns=observeTable.columns);

'''
chi2
compute chi squared from a contingency table
'''

def chi2(observed, **expectArgs):
    expected = np.ravel(expectTable(observed, **expectArgs));
    observed = np.ravel(observed);
    return np.sum((observed-expected)**2/expected);


'''
Risk function, just for helping make it readable
'''
def getRisk(contingencyMatrix):
    # outcomes need to be on rows
    rowSums= np.sum(contingencyMatrix, axis=0);
    # now, divide each row by the sum of the row
    #I guess, make a matrix the same size as input matrix
    sumMat = np.repeat(rowSums,contingencyMatrix.shape[1]).reshape((-1,contingencyMatrix.shape[1])).T;
    return contingencyMatrix / sumMat

'''
Relative Risk
RR = riskA/riskB
'''
def getRelativeRisk(conTable, riskVar, colInterest):
    '''
    Requires: 
      conTable is a pandas DF with 2 columns and named indeces
      outcomes are in the rows
      riskVar is the name of the row index
      colInterest is number or name of column
    '''
    if isinstance(colInterest, str):
        colNumber = conTable.columns.get_loc(colInterest);
    else:
        colNumber = colInterest;
        colInterest = conTable.columns[colNumber];
    #get risks
    riskObserved = pd.DataFrame(
        getRisk(conTable.as_matrix()),
        index=conTable.index, 
        columns=conTable.columns
    );
    riskOfInterest = riskObserved.loc[riskVar];
    if not colNumber:
        otherCol = 1;
    else:
        otherCol = 0;
    RR = riskOfInterest[colNumber]/riskOfInterest[otherCol];
    return RR


'''
Chi Squared bootstrap
'''
def chi2boot(observed, margin=0, B=100):
    '''
    Computes chi-squared and bootstrap NHST
    margin input indicates which margin of the observed contingency table
    contains the outcome varaible where 0=index (rows) and 1=columns
    '''
    x2_observed = chi2(observed);
    #detect margin and force outcome in 1st column
    if not margin:
        outcome_ = observed.index.tolist();
        test_ = observed.columns.tolist();
    else:
        outcome_ = observed.columns.tolist();
        test_ = observed.index.tolist();
    observedLong = pd.DataFrame(
    utils.expandGrid(
        outcome_,
        test_, 
        doPaste=False, 
        expansion = np.ravel(np.int64(observed), order='F')
    ), 
    columns=['Outcome', 'Test']
    );
    #boot
    chi2_NHST = np.zeros(B);
    # make a copy of the data to run the nhst randomization
    nhstData = observedLong.copy();
    nRows = len(observedLong.index);
    for b in range(B):
        # NHST randomization
        nullOutcome = observedLong['Outcome'].sample(nRows,replace=True);
        nhstData['Outcome'] = nullOutcome.values;
        NHSTTable = pd.crosstab(
          nhstData['Outcome'],
          nhstData['Test']
        );
        #Pandas reorganizes stuff, let's make sure we get it back in order
        NHSTTable = NHSTTable.loc[outcome_,test_];
        chi2_NHST[b] = chi2(NHSTTable)
    return {
    'Bootstraps': chi2_NHST,
    'Observed': x2_observed,
    'pvalue': np.mean(chi2_NHST >= x2_observed)
    }


