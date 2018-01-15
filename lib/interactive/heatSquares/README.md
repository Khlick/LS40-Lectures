This is a heatmap inspired by [this](http://bl.ocks.org/tjdecke/5558084) Trulia recreation, with the following additions:
<ol>
<li>This iteration uses [colorBrewer.js](https://github.com/mbostock/d3/blob/master/lib/colorbrewer/colorbrewer.js) for the color scheme.</li>
<li>Tool-tips using [tool-tips](http://labratrevenge.com/d3-tip/) to show the value.</li>
<li>The user can update the tile values. The values are generated from a probability distribution. I created a short script (rand.js) that generates a Normal random variable using the Box-Muller transformation, an Exponential distribution and a Logistic distribution.</li>