# LARA Mass Export

This enables mass export of all activities and sequences from LARA.

This script is split into multiple steps where each previous step feeds into the next:

The first step is invoked via: `npm run generate-csvs` which will generate a csv of all the activites and a csv of all the sequences.

The second step is invoked with `npm run export-json` which will export all the activies and sequences found in the csv files.

Once exported the json files can be uploaded to S3 via this `aws` CLI invocation:

TODO
