# Wayfinding

Wayfinding is a website designed to help students navigate the American River College Campus.

## Google Slides presentation

A detailed guide to the Wayfinding project can be found [here](https://docs.google.com/presentation/d/14uy2DAPB68twqYutxfy9it2A-veyfG2TyEI0Ig03Pk8/edit?usp=sharing).

## Getting Started

To get started, you'll need to download and unzip the project to the directory of your choice.

### Prerequisites

You will need an IDE that supports Javascript if you want to edit the program's files.
If you want to launch the website, you'll need some way of creating a server to host the site.
I use Python's simple HTTP server as a host, and have written a batch file to launch the website with a single double-click.

If you do not have Python installed, download the latest version of Python [here](https://www.python.org/downloads/).

### Launching the site

If you want to launch a development version of the site, navigate to the folder containing the project using either your file explorer or terminal.
Double click on the launch.bat file, or enter into your terminal:

```
batch
```

If the batch file does not work, try one of the following:

```
python -m http.server
```
or
```
python -m SimpleHTTPServer
```

Of course, you could always use your preferred method of launching a website.

If the batch file produced this output
```
Open your web browser to localhost:8000 to view the webpage
Press control-c to exit
Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/) ...
```
everything is working correctly!

## Deployment

This version of Wayfinding is not meant for use as a deployed website,
merely as a place to test new features for the official version on the ARC website [link](https://www.arc.losrios.edu/about-us/campus-map-app).

It has only been tested in Google Chrome, so you will want to pack it with Webpack or Babel before deploying.

## Contributing

This project is the property of the American River College Design Hub, and as such, is not open to contributions from external parties. If you are an intern or employee in the Design Hub, contact Matt Crow (w# is 1599227) if you wish to contribute.


## Authors

* **Matt Crow** - *Programmer* - [IronHeart7334](https://github.com/IronHeart7334)

See also the list of [contributors](https://github.com/IronHeart7334/Wayfinding/contributors) who participated in this project.

## Acknowledgments

* Thank you [PurpleBooth](https://github.com/PurpleBooth) for this awesome readme template! [link to template](https://gist.github.com/PurpleBooth/109311bb0361f32d87a2)

