# RWAHS Shop Migration

Migration scripts from legacy database for Magento2 used for RWAHS shop.

The overall flow of data for the migration process is as follows:

1. Use `mdbtools` commands to extract data from legacy Access database into CSV files.
2. Use custom `node` scripts to convert the legacy CSV data into a CSV format compatible with Magento2.
3. Import the processed CSV into Magento2 using its CSV import functionality.

## Prerequisites

* `mdbtools` can be installed via `apt-get`.
* `node` is recommended to be installed either via `nvm` (https://github.com/creationix/nvm) or using the instructions
  given at https://gist.github.com/leftclickben/2fe0c9d5e9cb64076880.

MySQL and PHP are not prerequisites.  Although the eventual target system is Magento2, and it uses PHP with a MySQL
database, the actual target for the migration scripts is a Magento2-compatible CSV file, not the database.  Magento2
itself requires PHP, and handles the task of importing from CSV into MySQL.

## Setting Up

Once this repo is cloned and prerequisites are installed, all that is required is to install the local node package 
dependencies using the standard command:

    npm install

## Path Configuration

''TODO''

## Running a Migration

Once the migration configuration has been created and verified, running a migration is simply a matter of running the
main `migrate` script.  From the project root:

    bin/migrate

This wrapper script sets up the relevant directories, cleans up the results of previous migrations, and then passes
control to the `process-csv.js` node script, which generates the target CSV.

Assuming there are no errors, when the `migrate` script is complete, the target directory will be populated with the
resulting CSV files ready for import.
