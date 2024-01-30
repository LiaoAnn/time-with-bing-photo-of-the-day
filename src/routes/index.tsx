import {
  $,
  component$,
  useComputed$,
  useSignal,
  useVisibleTask$,
} from "@builder.io/qwik";
import { useLocation, type DocumentHead } from "@builder.io/qwik-city";
import isHexColor from "is-hexcolor";
import palettes from "nice-color-palettes";

type Position =
  | "top-left"
  | "top"
  | "top-right"
  | "left"
  | "center"
  | "right"
  | "bottom-left"
  | "bottom"
  | "bottom-right";

type SearchParams = {
  seconds: boolean;
  randomColors: boolean;
  fg: string;
  bg: string;
  font: string;
  fontSize: string;
  showLink: boolean;
  blink: boolean;
  position: Position;
  format: 12 | 24;
  pad: boolean;
  bgImage: boolean;
};

const getFlexPositions = (props: SearchParams) => {
  const { position } = props;
  const flexPosition = {
    alignItems: "center",
    justifyContent: "center",
  };

  if (position.includes("top")) {
    flexPosition.alignItems = "flex-start";
  } else if (position.includes("bottom")) {
    flexPosition.alignItems = "flex-end";
  }

  if (position.includes("left")) {
    flexPosition.justifyContent = "flex-start";
  } else if (position.includes("right")) {
    flexPosition.justifyContent = "flex-end";
  }

  return flexPosition;
};

export default component$(() => {
  const location = useLocation();
  const searchParams = useComputed$<SearchParams>(() => {
    const params = new URLSearchParams(location.url.search);
    const font =
      params.get("font") ||
      `system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    Helvetica,
    Arial,
    sans-serif,
    'Apple Color Emoji',
    'Segoe UI Emoji'`;
    let bg = params.get("bg")
      ? isHexColor(`#${params.get("bg")}`)
        ? `#${params.get("bg")}`
        : (params.get("bg") as string)
      : "black";
    let fg = params.get("fg")
      ? isHexColor(`#${params.get("fg")}`)
        ? `#${params.get("fg")}`
        : (params.get("fg") as string)
      : "royalblue";
    const fontSize = params.get("fontSize") || "10em";
    const position = (params.get("position") || "center") as Position;
    const seconds = params.get("seconds") !== null;
    const randomColors = params.get("randomColors") !== null;
    const showLink = params.get("showLink") !== null;
    const blink = params.get("blink") !== null;
    const format = (params.get("format") || 24) as 12 | 24;
    const pad = params.get("pad") !== null;
    const bgImage = params.get("bgImage") !== null;

    if (randomColors) {
      const palette = palettes[Math.ceil(Math.random() * palettes.length)];
      fg = palette[0];
      bg = palette[palette.length - 1];
    }

    return {
      seconds,
      randomColors,
      fg,
      bg,
      font,
      fontSize,
      showLink,
      blink,
      position,
      format,
      pad,
      bgImage,
    };
  });

  const bingPhotoUrl = useSignal<string | undefined>(undefined);
  const getBingPhotoUrl = $(async () => {
    const url = await fetch(`/api`).then((res) => res.text());
    return url;
  });
  useVisibleTask$(({ cleanup }) => {
    const setUrl = async () => {
      if (searchParams.value.bgImage) {
        bingPhotoUrl.value = await getBingPhotoUrl();
      }
    };
    setUrl();
    const interval = setInterval(setUrl, 1000 * 60 * 60 * 6); // 6 hours
    cleanup(() => clearInterval(interval));
  });

  const currTime = useSignal({ hours: "", minutes: "", seconds: "" });
  const lastTickHadColon = useSignal(false);
  const tick = $(async () => {
    const now = new Date();

    let hours = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();

    if (searchParams.value.format === 12) {
      hours = hours % 12 || 12;
    }

    const time = {
      hours: hours.toString().padStart(searchParams.value.pad ? 2 : 1, "0"),
      minutes: minutes.toString().padStart(2, "0"),
      seconds: seconds.toString().padStart(2, "0"),
    };
    currTime.value = time;
  });
  useVisibleTask$(async ({ cleanup }) => {
    tick();
    const timeInterval = setInterval(tick, 1000);
    // Let colons blink twice a second
    const blinkInterval = setInterval(() => {
      lastTickHadColon.value = !lastTickHadColon.value;
    }, 500);
    cleanup(() => clearInterval(timeInterval));
    cleanup(() => clearInterval(blinkInterval));
  });

  const mouseX = useSignal(0);
  const mouseY = useSignal(0);
  const mouseInteraction = useSignal(false);
  useVisibleTask$(({ track, cleanup }) => {
    track(mouseX);
    track(mouseY);
    mouseInteraction.value = true;
    const timeout = setTimeout(() => {
      mouseInteraction.value = false;
    }, 2000);
    cleanup(() => clearTimeout(timeout));
  });
  const mouseInteracting = $((event: MouseEvent) => {
    mouseX.value = event.clientX;
    mouseY.value = event.clientY;
  });

  const flexPosition = getFlexPositions(searchParams.value);
  const colonOpacity = useComputed$(() =>
    searchParams.value.blink && lastTickHadColon.value ? 0 : 1,
  );

  return (
    <>
      <a
        href="https://github.com/LiaoAnn/time-with-bing-photo-of-the-day"
        class={[
          "absolute left-[20px] top-[20px] text-xl transition-all ease-in-out",
          mouseInteraction.value || searchParams.value.showLink
            ? "opacity-70"
            : "opacity-0",
        ]}
        style={{
          color: searchParams.value.fg,
        }}
      >
        Code available here
      </a>
      <main
        onMouseMove$={mouseInteracting}
        class={["flex h-[100vh] w-[100vw] font-bold tabular-nums"]}
        style={{
          fontFamily: searchParams.value.font,
          alignItems: flexPosition.alignItems,
          justifyContent: flexPosition.justifyContent,
          color: searchParams.value.fg,
          backgroundColor: searchParams.value.bg,
          fontSize: searchParams.value.fontSize,
          backgroundImage: searchParams.value.bgImage
            ? `url(${bingPhotoUrl.value})`
            : undefined,
          "background-color": searchParams.value.bgImage
            ? undefined
            : searchParams.value.bg,
        }}
      >
        <div id="time" class="m-[1rem]">
          <span id="hours">{currTime.value.hours}</span>
          <span class="colon" style={{ opacity: colonOpacity.value }}>
            :
          </span>
          <span id="minutes">{currTime.value.minutes}</span>
          {currTime.value.seconds && (
            <>
              <span class="colon" style={{ opacity: colonOpacity.value }}>
                :
              </span>
              <span id="seconds">{currTime.value.seconds}</span>
            </>
          )}
        </div>
      </main>
    </>
  );
});

export const head: DocumentHead = {
  title: "Time with Bing Photo of the Day",
};
