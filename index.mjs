import fetch from "node-fetch";
import https from "https";
import fs from "fs";

import "dotenv/config";

const API_URL = "https://api.play.ht/api/v1/convert";
const STATUS_URL = "https://api.play.ht/api/v1/articleStatus";

const AUTHORIZATION = process.env.AUTHORIZATION;
const USER_ID = process.env.USER_ID;

/**
 * Sends a Request to the play.ht api to start converting a text to speech
 * @param {String} text The text to convert to speech
 * @returns A promise that resolves as soon as the request is done
 */
const convertTextToSpeech = async (text) => {
  const options = {
    method: "POST",
    headers: {
      accept: "audio/mpeg",
      "content-type": "application/json",
      AUTHORIZATION: `Bearer ${AUTHORIZATION}`,
      "X-USER-ID": USER_ID,
    },
    body: JSON.stringify({
      content: text,
      voice: "fi-FI-Standard-A",
    }),
  };

  const res = await fetch(API_URL, options);
  const json = await res.json();
  return json;
};

/**
 * Takes a id and checks the conversion status with the play.ht servers
 * @param {String} id The transcriptionId of the conversion
 * @returns A promise that resolves after the request finishes
 */
const checkConversionState = async (id) => {
  const url = `${STATUS_URL}?transcriptionId=${id}`;
  const options = {
    method: "GET",
    headers: {
      accept: "application/json",
      AUTHORIZATION: AUTHORIZATION,
      "X-USER-ID": USER_ID,
    },
  };

  const res = await fetch(url, options);
  const json = await res.json();
  return json;
};

/**
 * Takes a url to download a mp3 from and saves it using the given filename
 * @param {String} url The url of the file to download
 * @param {String} output The name of the outputfile
 */
const saveAudioFileToDisk = (url, output) => {
  const fileStream = fs.createWriteStream(output);

  https.get(url, (response) => {
    response.pipe(fileStream);

    response.on("end", () => {
      console.log("Download complete.");
    });
  });
};

/**
 * Starts a conversion process, waits for it to complete and saves the
 * resulting mp3 to the disk under the given name.
 * @param {String} text The text to convert to speech
 * @param {String} output The filename of the outputfile
 */
const audioPipeline = async (text, output) => {
  const create = await convertTextToSpeech([text]);
  let status;
  while (true) {
    status = await checkConversionState(create.transcriptionId);
    console.log("Conversion status is: " + status.converted);
    if (status.converted !== false) break;
  }
  saveAudioFileToDisk(status.audioUrl, `output/${output}`);
};

audioPipeline("Tervetuloa, mitä kuulu?.", "greeting.mp3");
