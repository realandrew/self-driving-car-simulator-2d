const carCanvas = document.getElementById('carCanvas');
carCanvas.width = 200;
const networkCanvas = document.getElementById('networkCanvas');
networkCanvas.width = 300;

const carCtx = carCanvas.getContext("2d");
const networkCtx = networkCanvas.getContext("2d");

const road = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

let N = 1000;
let mutationRate = 0.5;

let genNum = 0;
let cars = [];
let bestCar;
let traffic = [];

// Document elements
let carCountInput;
let carCountVal;
let totalCarCount;
let mutationRateInput;
let mutationRateVal;
let hasSaveEle;
let carsRemainingEle;

window.addEventListener('load', () => {
  carCountInput = document.getElementById('carCount');
  carCountVal = document.getElementById('carCountVal');
  totalCarCount = document.getElementById('totalCarCount');
  mutationRateInput = document.getElementById('mutationRate');
  mutationRateVal = document.getElementById('mutationRateVal');
  hasSaveEle = document.getElementById('hasSave');
  carsRemainingEle = document.getElementById('carsRemaining');

  carCountInput.addEventListener('input', updateCarCount);
  mutationRateInput.addEventListener('input', updateMutationRate);

  checkSave();
  if (localStorage.getItem("carCount") !== null) {
    carCountInput.value = localStorage.getItem("carCount");
  }
  updateCarCount();
  if (localStorage.getItem("mutationRate") !== null) {
    mutationRateInput.value = localStorage.getItem("mutationRate");
  }
  updateMutationRate();

  nextGeneration();
  animate();
});

function updateCarCount(e) {
  N = carCountInput.value;
  localStorage.setItem("carCount", N);
  carCountVal.innerText = N;
  totalCarCount.innerText = N;
}

function updateMutationRate(e) {
  mutationRate = mutationRateInput.value / 100;
  localStorage.setItem("mutationRate", mutationRate * 100);
  mutationRateVal.innerText = Number.parseInt((mutationRate * 100)).toFixed(0) + '%';
}

function nextGeneration() {
  genNum++;
  document.getElementById("genNum").innerHTML = genNum;
  cars = generateCars(N);
  bestCar = cars[0];
  if (localStorage.getItem("bestBrain")) {
    for (let i = 0; i < cars.length; i++) {
      cars[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
      if (i != 0) {
        NeuralNetwork.mutate(cars[i].brain, mutationRate);
      }
    }
  }

  traffic = [
    new Car(road.getLaneCenter(1), 0, 30, 50, ControlType.DUMMY, 2),
    new Car(road.getLaneCenter(1), -100, 30, 50, ControlType.DUMMY, 2),
    new Car(road.getLaneCenter(0), -300, 30, 50, ControlType.DUMMY, 2),
    new Car(road.getLaneCenter(2), -300, 30, 50, ControlType.DUMMY, 2),
    new Car(road.getLaneCenter(0), -500, 30, 50, ControlType.DUMMY, 2),
    new Car(road.getLaneCenter(1), -500, 30, 50, ControlType.DUMMY, 2),
    new Car(road.getLaneCenter(1), -700, 30, 50, ControlType.DUMMY, 2),
    new Car(road.getLaneCenter(2), -700, 30, 50, ControlType.DUMMY, 2)
  ];
}

function save() {
  localStorage.setItem("bestBrain", JSON.stringify(bestCar.brain));
  checkSave();
}

function checkSave() {
  hasSaveEle.innerText = hasSave();
}

function hasSave() {
  if (localStorage.getItem("bestBrain") === null) {
    return false;
  } else {
    return true;
  }
}

function discardSave() {
  localStorage.removeItem("bestBrain");
  checkSave();
}

function resetSettings() {
  carCountInput.value = null;
  mutationRateInput.value = null;
  localStorage.removeItem("carCount");
  localStorage.removeItem("mutationRate");
}

function generateCars(n) {
  const cars = [];
  for (let i = 1; i <= n; i++) {
    cars.push(new Car(road.getLaneCenter(1), 100, 30, 50, ControlType.ML));
  }
  return cars;
}

function animate(time) {
  carsRemainingEle.innerText = cars.filter(c => !c.damaged).length;
  if (cars.filter(c => !c.damaged).length === 0) {
    save();
    nextGeneration();
  }

  for (let i = 0; i < traffic.length; i++) {
    traffic[i].update(road.borders, []);
  }
  for (let i = 0; i < cars.length; i++) {
    cars[i].update(road.borders, traffic);
  }
  
  // Fitness function = highest forward distance from start
  // TODO: Optimize for speed & stability as well
  bestCar = cars.find(
    c => c.y == Math.min(...cars.map(c => c.y))
  );

  carCanvas.height = window.innerHeight;
  networkCanvas.height = window.innerHeight;

  carCtx.save();
  // Translate to center the car ("moves" the road)
  carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);

  road.draw(carCtx);
  for (let i = 0; i < traffic.length; i++) {
    traffic[i].draw(carCtx, "#242331");
  }
  carCtx.globalAlpha = 0.2;
  for (let i = 0; i < cars.length; i++) {
    cars[i].draw(carCtx, "#BF3100");
  }
  
  carCtx.globalAlpha = 1;
  bestCar.draw(carCtx, "#2D7DD2", true);

  carCtx.restore();

  networkCtx.lineDashOffset = -time / 50;
  Visualizer.drawNetwork(networkCtx, bestCar.brain);
  requestAnimationFrame(animate);
}