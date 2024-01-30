import { type RequestHandler } from "@builder.io/qwik-city";

export const onGet: RequestHandler = async ({ send }) => {
  const baseUrl = "https://www.bing.com";
  const response = await fetch(
    `https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1`,
  );
  const json = await response.json();
  const imageUrl = baseUrl + json.images[0].url;
  send(200, imageUrl);
};
