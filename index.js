const step = process.argv[2];

switch (step) {
  case "generate-csvs":
    console.log("TODO: generate csvs step");
    break;

  case "export-json":
    console.log("TODO: export json step");
    break;

  case undefined:
    console.error("Missing step option!");
    break;

  default:
    console.error("Unknown step:", step);
    break;
}