# scl-image-mover

SCL Image mover

Takes a list of images from the Scapeye database, blurs the license plate, and writes it to a folder for each OWN vehicle class.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- **NodeJS**
  Either install like `choco install nodejs` or grab the latest version here: [NodeJs.org](https://nodejs.org/en/download/)

- **IDE**
  To develop, any code editor will do, but `Visual Studio Code` and `PHPStorm` are recommended environments.

- **Database**
  A list of images is pulled from the Scapeye MySQL database.

- **Images**
  Images are stored on disk, and not in the database. The database only contains the paths of the images.

- **Storage**
  This tool will write a copy of each image that it processes, so make sure that access is fast, and that there's sufficient disk space.

## Running the tests

Explain how to run the automated tests for this system

## Authors

**Wouter van Nifterick** - *Initial work* - [WouterVanNifterick](https://github.com/WouterVanNifterick)
