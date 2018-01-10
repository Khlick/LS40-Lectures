/* Keeps track of a die roll and the  */
var dice = {
  sides: 6,
  roll: function () {
    var randomNumber = Math.floor(Math.random() * this.sides) + 1;
    return randomNumber;
  }
}

// init globals
var rollCount = 0;
var probCuml = new Array(6);
function initGlobals(){
  rollCount = 0;
  probCuml = Array.apply(null,Array(6)).map(Number.prototype.valueOf,0);
} 

//Prints dice roll to the page

function printNumber(number) {
  var placeholder = document.getElementById('placeholder');
  placeholder.innerHTML = number;
}

function printProbs(number){
  // compute probs
  probCuml[number-1] += 1;
  var probTemp = new Array(6);
  for(var ind=0; ind<6; ind++){
    if(probCuml[ind] != 0){
      probTemp[ind] = (ind+1).toString() + ": " +(probCuml[ind]/rollCount).toString();
    } else {
      probTemp[ind] = (ind+1).toString() + ": " + "0";
    }
    
  }
  var probspace = document.getElementById('probspace');
  probspace.innerHTML = probTemp.toString();
}

var button = document.getElementById('button');
var resetter = document.getElementById('reset');

button.onclick = function() {
  var result = dice.roll();
  var output = '';
  output += "&#x268" + (result-1) + "; ";
  rollCount += 1;
  printNumber(output);
  printProbs(result);
};

resetter.onclick = function() {
  initGlobals();
  printNumber("");
  printProbs();
};

initGlobals();