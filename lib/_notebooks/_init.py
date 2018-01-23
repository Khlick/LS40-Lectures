# -*- coding: utf-8 -*-
"""
Initialize the workspace for lecture figures.
Sets a few mpl defaults to create light color axes and provides a color hash.
Loads in some custom functions from the Tools library (custom local)

@author: khris
"""

#------------------ :Depends: ------------------#
# Standard library
import numpy as np
import matplotlib as mpl
from matplotlib import pyplot as pyp
import pandas as pd
from scipy import stats
from scipy.interpolate import interp1d

# Custom libraries
import Tools.fourier as fl
import Tools.utils as utils
import Tools.stats as st

###

#------------------- :Colors: ------------------#
col = {
    'dkGrey':   '#202020',  # dark grey 
    'dkRed':    '#362121',  # dark redish  
    'dkBlue':   '#001526',  # dark blueish  

    # text and decorations 

    'purple':   '#9469AD',  # purple  
    'blue':     '#88C9C1',  # blue  
    'offwhite': '#FFF8D0',  # offwhite  
    'orange':   '#F79A52',  # orange  
    'red':      '#E04B4B',  # red  
    'green':    '#73B55B',  # green
    'grey':     '#d2d2d2',  # grey
    'grey2':    '#a6a6a6',  # darker but not too dark
    'satBlue':  '#4682B4',  # A darker blue
    'yellow':   '#F5D76E'   # yellow
};


#----------------- :Behavior: ------------------#
params = {
    'axes.edgecolor': col['grey'],
    'axes.labelcolor': col['grey'],
    'xtick.color': col['grey'],
    'ytick.color': col['grey'],
    'grid.color': col['grey2'],
    'text.color': col['grey'],
    'axes.spines.right': False,
    'axes.spines.top': False,
    'xtick.top': False,
    'xtick.minor.top': False,
    'xtick.major.top': False,
    'ytick.right': False,
    'ytick.major.right': False,
    'ytick.minor.right': False
};
for p in params:
    mpl.rcParams[p] = params[p]


