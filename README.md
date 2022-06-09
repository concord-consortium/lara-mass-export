# LARA Mass Export

This enables mass export of all activities and sequences from LARA.

## Setup

Before running this script it is recommended to use ssh port forwarding to connect to the LARA db through an ECS host as follows:

ssh -L 127.0.0.1:3800:LARA-DB-HOSTNAME:3306 USERNAME@ECS-HOSTNAME

for example:

ssh -L 127.0.0.1:3800:lara-staging-vpc.cheea3ib6y8u.us-east-1.rds.amazonaws.com:3306 dmartin@ec2-54-172-190-159.compute-1.amazonaws.com

and then create a .env file (optionaly starting with the included `.env.sample` file) with the following contents:

```
LARA_URL=      ; example: https://authoring.concord.org/
LARA_SESSION=  ; the `_lightweight-standalone_session` cookie value (see below)
DB_HOSTNAME=   ; example: localhost if using port forwarding or lara-vpc.cheea3ib6y8u.us-east-1.rds.amazonaws.com if direct connect
DB_USERNAME=   ; example: master
DB_PASSWORD=   ; example: nice-try-haxxors
DB_PORT=       ; example: 3800 if using the port forwarding line above or 3306 if directly connecting
WAIT_BETWEEN_REQUESTS= ; example: 1000 to wait 1 second between export requests
```

The `_lightweight-standalone_session` cookie value can be copied from Chrome Developer Tools in the Application tab under the Cookies storage menu entry after you login as an admin to the LARA_URL specified in the .env file.  Make sure you check the "Show url decoded" checkbox before copying the value.  This cookie is needed as export is behind a permisssion check.

## Usage

This script is split into two steps where each previous step feeds into the next.

The first step is invoked via: `npm run generate-csvs` which will generate a csv of all the activites and a csv of all the sequences.  The csv files will be placed in a subfolder named `data/DD-Mon-YYY`.

The second step is invoked with `npm run export-json` which will export all the activies and sequences found in the csv files.  The json files will be placed in the same subfolder as the previous step.

Once exported the json files can be uploaded to S3 via the `aws` CLI.  An upload step has not been added to the script as the CLI handles this well.
