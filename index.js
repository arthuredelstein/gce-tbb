let co = require('co');

let gcloud = require('gcloud')({
  projectId: 'tbb1-996',
  keyFilename: '../tbb1-f5c67db58226.json'
});

let gce = gcloud.compute();

let getVMs = function () {
  return new Promise(function (fulfil, reject) {
    gce.getVMs((err, result) => err ? reject(err) : fulfil(result));
  });
};

let runOperation = function (opFunction) {
  return new Promise(function (fulfil, reject) {
    opFunction(function (err, operation, apiResponse) {
      operation.on('complete', function (metadata) {
        fulfil(metadata);
      });
      operation.on('error', function (err) {
        reject(err);
      });
    });
  });
};

let startVM = function (vm) {
  return runOperation(f => vm.start(f));
};

let stopVM = function (vm) {
  return runOperation(f => vm.stop(f));
};

co(function* () {
  console.log("hi");
  try {
    let vms = yield getVMs();

    let vm = vms[1];

    console.log(vm);

    // start
    console.log("START================");
    console.log(yield startVM(vm));

    // stop
    console.log("STOP================");
    console.log(yield stopVM(vm));

  } catch (e) {
    console.log(e);
  }
});
