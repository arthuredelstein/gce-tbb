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
  try {
    let remoteCommand = process.argv.slice(2).join(" ");
    let vm = yield getVM('instance-3');
    // Change VM to high cpu mode.
    yield changeMachineType(vm, "n1-highcpu-32");
    // Obtain the external IP
    let metadata = yield getMetadata(vm);
    let externalIP = getExternalIP(metadata);
    console.log("External IP: " + externalIP);
    console.log("Sleeping for 10 seconds");
    yield sleepPromise(10000);
    console.log("starting remote command...");
    let commandToExecute = 'ssh ' + externalIP + ' "sh -c \'' + remoteCommand + '\'"';
    console.log(commandToExecute);
    yield echoExec(commandToExecute);
    console.log("done");
    yield changeMachineType(vm, "n1-standard-1");
    // Obtain the external IP again in case it changed
    let metadata2 = yield getMetadata(vm);
    let externalIP2 = getExternalIP(metadata);
    console.log("Finished! " + externalIP2 + " is ready");
  } catch (e) {
    console.log(e);
  }
});
