/* jshint esnext:true */
const path = require('path');

let gce = require('@google-cloud/compute')({
  projectId: 'tbb1-996',
  keyFilename: path.resolve(__dirname, '../tbb1-key.json'),
});

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

let sleepPromise = t => new Promise(resolve => setTimeout(resolve, t));

let getExternalIP = metadata => metadata.networkInterfaces[0].accessConfigs[0].natIP;

const exec = require('child_process').exec;

let echoExec = cmd => new Promise(function (fulfil, reject) {
  let childProcess = exec(cmd, { maxBuffer: Number.MAX_SAFE_INTEGER,
                                 timeout: (30 * 60 * 1000) });
  childProcess.stdout.setEncoding('utf8');
  childProcess.stderr.setEncoding('utf8');
  childProcess.stdout.on('data', lines => process.stdout.write(lines));
  childProcess.stderr.on('data', lines => process.stderr.write(lines));
  childProcess.on('exit', event => fulfil(event));
});

module.exports = {
  getVM : getVM,
  startVM : startVM,
  stopVM : stopVM,
  getMetadata : getMetadata,
  sleepPromise : sleepPromise,
  getExternalIP : getExternalIP,
  echoExec : echoExec
};
