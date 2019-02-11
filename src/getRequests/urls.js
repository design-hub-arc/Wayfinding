/*
This file is used to specify the URLs used by this program to reteive data from external files.

!!!!!
IMPORTANT!!! : do NOT change ANYTHING to the left of the equal signs on each line! Doing so WILL break the program!
!!!!!

Before changing this file, it might be a good idea to save a copy in case something goes wrong...
*/

export const mapURL = "https://drive.google.com/uc?id=1Lt58PPBmimpY8hIlCJgg4qvF8CLt_mis";
// this links to an image that is used as the campus map

/*
HOW TO CHANGE THE mapURL FILE:
    Can't do yet, unless the map shows the same section of campus as the current one.
	1. Put a .png file into google drive.
	2. copy that image's URL using "get sharable link"
	3. paste the URL after var mapURL = ... in place of the existing URL
	4. make sure there are quote marks around the URL (can be double or single quotes)
	5. replace the "open" in the URL with "uc"
	6. ???
*/


export const classesURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vREUvLP1uMDKADze2uCHx6jN4voxvO41g-gZ5pEDK_vJ0M9LA7UmfRgqJeX_NRDZsMMC_lOs2A0OKtm/pub?gid=57491238&single=true&output=csv";
//the huge class data extract

export const masterSheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSuRqzSZ2LyamtAz7Gs88JkOiBmyIx8ND6kqRhxbunGVPBw4Wqrc1yYgfjFeC6m_Dx0sbXTE4Q5k3uQ/pub?gid=0&single=true&output=csv";
//the master spreadsheet containing links to all the data used by the program

export const artFinderURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTF1ockLSS6RTguLW0pgY2HUPAbyiZQ8OG2-EqBBojtuBb662ra6I08LmvUC0ZTvyjKMGPdxgeCtbBf/pub?gid=0&single=true&output=csv";
//WIP. The master sheet for artfinder