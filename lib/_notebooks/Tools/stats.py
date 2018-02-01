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
class StepFunction(object):
    """
    A basic step function.

    Values at the ends are handled in the simplest way possible:
    everything to the left of x[0] is set to ival; everything
    to the right of x[-1] is set to y[-1].

    Parameters
    ----------
    x : array-like
    y : array-like
    ival : float
        ival is the value given to the values to the left of x[0]. Default
        is 0.
    sorted : bool
        Default is False.
    side : {'left', 'right'}, optional
        Default is 'left'. Defines the shape of the intervals constituting the
        steps. 'right' correspond to [a, b) intervals and 'left' to (a, b].

    Examples
    --------
    >>> import numpy as np
    >>> from statsmodels.distributions.empirical_distribution import StepFunction
    >>>
    >>> x = np.arange(20)
    >>> y = np.arange(20)
    >>> f = StepFunction(x, y)
    >>>
    >>> print(f(3.2))
    3.0
    >>> print(f([[3.2,4.5],[24,-3.1]]))
    [[  3.   4.]
     [ 19.   0.]]
    >>> f2 = StepFunction(x, y, side='right')
    >>>
    >>> print(f(3.0))
    2.0
    >>> print(f2(3.0))
    3.0
    """

    def __init__(self, x, y, ival=0., sorted=False, side='left'):

        if side.lower() not in ['right', 'left']:
            msg = "side can take the values 'right' or 'left'"
            raise ValueError(msg)
        self.side = side

        _x = np.asarray(x)
        _y = np.asarray(y)

        if _x.shape != _y.shape:
            msg = "x and y do not have the same shape"
            raise ValueError(msg)
        if len(_x.shape) != 1:
            msg = 'x and y must be 1-dimensional'
            raise ValueError(msg)

        self.x = np.r_[-np.inf, _x]
        self.y = np.r_[ival, _y]

        if not sorted:
            asort = np.argsort(self.x)
            self.x = np.take(self.x, asort, 0)
            self.y = np.take(self.y, asort, 0)
        self.n = self.x.shape[0]

    def __call__(self, time):

        tind = np.searchsorted(self.x, time, self.side) - 1
        return self.y[tind]


class ECDF(StepFunction):
    """
    Return the Empirical CDF of an array as a step function.

    Parameters
    ----------
    x : array-like
        Observations
    side : {'left', 'right'}, optional
        Default is 'right'. Defines the shape of the intervals constituting the
        steps. 'right' correspond to [a, b) intervals and 'left' to (a, b].

    Returns
    -------
    Empirical CDF as a step function.

    Examples
    --------
    >>> import numpy as np
    >>> from statsmodels.distributions.empirical_distribution import ECDF
    >>>
    >>> ecdf = ECDF([3, 3, 1, 4])
    >>>
    >>> ecdf([3, 55, 0.5, 1.5])
    array([ 0.75,  1.  ,  0.  ,  0.25])
    """
    def __init__(self, x, side='right'):
        step = True
        if step: #TODO: make this an arg and have a linear interpolation option?
            x = np.array(x, copy=True)
            x.sort()
            nobs = len(x)
            y = np.linspace(1./nobs,1,nobs)
            super(ECDF, self).__init__(x, y, side=side, sorted=True)
        else:
            return interp1d(x,y,drop_errors=False,fill_values=ival)

