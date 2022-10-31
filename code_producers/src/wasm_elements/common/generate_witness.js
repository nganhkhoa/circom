const wc = require("./witness_calculator.js");

const process = require("process");
const {
  readFileSync,
  writeFile
} = require("fs");

function isValidType(key) {
  if (typeof key === "number") {
    return Number.isSafeInteger(key) && key >= 0;
  } else if (typeof key === "string") {
    return key.match(/^(0x)?[0-9A-Fa-f]*$/g)
  } else if (key instanceof Array) {
    return key.every(isValidType);
  }
  return false;
}

if (process.argv.length != 5) {
  console.log("Usage: node generate_witness.js <file.wasm> <input.json> <output.wtns>");
  process.exit(1);
} else {
  const input = JSON.parse(readFileSync(process.argv[3], "utf8"));

  if (input instanceof Array) {
    console.log("Wrong input format. Input must be an Object.");
    process.exit(1);
  }

  let violated = Object.keys(input)
    .reduce((violated, key) => {
      const valid = isValidType(input[key]);
      if (!valid) {
        console.log(`[+] ${key} is invalid.`)
      }
      return violated || !valid;
    }, false);

  if (violated) {
    console.log("Keys must be either number/string/array.");
    console.log(`Number must be >= 0 and less than ${Number.MAX_SAFE_INTEGER}`);
    console.log(`String must be a hex digest.`);
    console.log(`Array must be a number/string/array, recursively.`);
    process.exit(1);
  }

  const buffer = readFileSync(process.argv[2]);
  wc(buffer)
    .then(async witnessCalculator => {
      const buff = await witnessCalculator.calculateWTNSBin(input, 0);
      writeFile(process.argv[4], buff, function(err) {
        if (err) throw err;
      });
    })
    .catch((err) => {
      console.log("Calculating witness failure.");
      console.log("This can be you passing the wrong number of arguments.");
      console.log("Below is the raw error log");
      console.log(err)
    });
}
