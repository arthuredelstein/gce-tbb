/* jshint esnext:true */

let co = require('co');

let gcloud = require('gcloud')({
  projectId: 'tbb1-996',
  keyFilename: '../tbb1-f5c67db58226.json'
});

let gce = gcloud.compute();

let simpleQuery = apiFunction => new Promise(function (fulfil, reject) {
  apiFunction((err, result) => err ? reject(err) : fulfil(result));
});

let getVMs = () => simpleQuery(callback => gce.getVMs(callback));

let getVM = name => getVMs().then((vms => vms.filter(vm => vm.name === name)[0]));

let runOperation = opFunction => new Promise(function (fulfil, reject) {
  opFunction(function (err, operation, apiResponse) {
    operation.on('complete', metadata => fulfil(metadata));
    operation.on('error', err => reject(err));
  });
});

let startVM = vm => runOperation(f => vm.start(f));

let stopVM = vm => runOperation(f => vm.stop(f));

let setMetadata = (vm, metadata) => runOperation(f => vm.setMetadata(metadata, f));

let getMetadata = vm => simpleQuery(callback => vm.getMetadata(callback));

let setMachineType = (vm, zone, machineType) => runOperation(f => vm.setMachineType(zone, machineType, f));

let changeMachineType = function* (vm, machineType) {
  if (!(yield getMetadata(vm)).machineType.endsWith("/" + machineType)) {
    console.log("stopping VM");
    yield stopVM(vm);
    console.log("change VM to " + machineType);
    yield setMachineType(vm, "us-central1-f", machineType);
    console.log("starting VM again");
  }
  yield startVM(vm);
  console.log("VM ready");
};

let sleepPromise = t => new Promise(resolve => setTimeout(resolve, t));

let getExternalIP = metadata => metadata.networkInterfaces[0].accessConfigs[0].natIP;

const exec = require('child_process').exec;

let echoExec = cmd => new Promise(function (fulfil, reject) {
  let childProcess = exec(cmd);
  childProcess.stdout.setEncoding('utf8');
  childProcess.stderr.setEncoding('utf8');
  childProcess.stdout.on('data', lines => process.stdout.write(lines));
  childProcess.stderr.on('data', lines => process.stderr.write(lines));
  childProcess.on('exit', event => fulfil(event));
});

co(function* () {

  console.log("hi");
  try {
    let vm = yield getVM('instance-3');
    // Change VM to high cpu mode.
    yield changeMachineType(vm, "n1-highcpu-16");
    // Obtain the external IP
    let metadata = yield getMetadata(vm);
    let externalIP = getExternalIP(metadata);
    console.log("External IP: " + externalIP);
    console.log("Sleeping for 10 seconds");
    yield sleepPromise(10000);
    console.log("building tor-browser.git");
    yield echoExec('ssh ' + externalIP + ' "nproc && cd tor-browser && ./mach build"');
    console.log("done building tor-browser.git");
    yield changeMachineType(vm, "n1-standard-1");
    // Obtain the external IP again in case it changed
    let metadata2 = yield getMetadata(vm);
    let externalIP2 = getExternalIP(metadata);
    console.log("Finished! " + externalIP2 + " is ready");
  } catch (e) {
    console.log(e);
  }
});
