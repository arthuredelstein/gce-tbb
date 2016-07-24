/* jshint esnext:true */

const co = require('co');

const { startVM, stopVM, setMachineType, getMetadata,
        getVM, sleepPromise, echoExec, getExternalIP } = require('./utils.js');

let changeMachineType = function* (vm, machineType) {
  if (!(yield getMetadata(vm)).machineType.endsWith("/" + machineType)) {
    console.log("stopping " + vm.name);
    yield stopVM(vm);
    console.log("changing " + vm.name + " to " + machineType);
    yield setMachineType(vm, machineType);
    console.log("starting " + vm.name + " again");
  }
  yield startVM(vm);
  console.log("VM ready");
};

co(function* () {

  console.log("hello");
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
