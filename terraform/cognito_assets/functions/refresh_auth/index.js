// based on https://raw.githubusercontent.com/aws-samples/cloudfront-authorization-at-edge/c99f34185384b47cfb2273730dbcd380de492d12/src/lambda-edge/refresh-auth/index.ts
const {
  parse as parseQueryString,
  stringify as stringifyQueryString,
} = require("querystring");
const {
  getCompleteConfig,
  extractAndParseCookies,
  generateCookieHeaders,
  httpPostWithRetry,
  createErrorHtml,
} = require("./shared/shared");

let CONFIG

export const handler = async (event) => {
  if (!CONFIG) {
    CONFIG = getCompleteConfig();
    CONFIG.logger.debug("Configuration loaded:", CONFIG);
  }
  CONFIG.logger.debug("Event:", event);
  const request = event.Records[0].cf.request;
  const domainName = request.headers["host"][0].value;
  let redirectedFromUri = `https://${domainName}`;

  try {
    const { requestedUri, nonce: currentNonce } = parseQueryString(
      request.querystring
    );
    redirectedFromUri += requestedUri || "";
    const {
      idToken,
      accessToken,
      refreshToken,
      nonce: originalNonce,
    } = extractAndParseCookies(
      request.headers,
      CONFIG.clientId,
      CONFIG.cookieCompatibility
    );

    validateRefreshRequest(
      currentNonce,
      originalNonce,
      idToken,
      accessToken,
      refreshToken
    );

    let headers: { "Content-Type": string; Authorization?: string } = {
      "Content-Type": "application/x-www-form-urlencoded",
    };

    if (CONFIG.clientSecret !== "") {
      const encodedSecret = Buffer.from(
        `${CONFIG.clientId}:${CONFIG.clientSecret}`
      ).toString("base64");
      headers["Authorization"] = `Basic ${encodedSecret}`;
    }

    let tokens = {
      id_token: idToken!,
      access_token: accessToken!,
      refresh_token: refreshToken!,
    };
    let cookieHeadersEventType: keyof typeof generateCookieHeaders;
    try {
      const body = stringifyQueryString({
        grant_type: "refresh_token",
        client_id: CONFIG.clientId,
        refresh_token: refreshToken,
      });
      const res = await httpPostWithRetry(
        `https://${CONFIG.cognitoAuthDomain}/oauth2/token`,
        body,
        { headers },
        CONFIG.logger
      ).catch((err) => {
        throw new Error(`Failed to refresh tokens: ${err}`);
      });
      tokens.id_token = res.data.id_token;
      tokens.access_token = res.data.access_token;
      cookieHeadersEventType = "newTokens";
    } catch (err) {
      cookieHeadersEventType = "refreshFailed";
    }
    const response = {
      status: "307",
      statusDescription: "Temporary Redirect",
      headers: {
        location: [
          {
            key: "location",
            value: redirectedFromUri,
          },
        ],
        "set-cookie": generateCookieHeaders[cookieHeadersEventType]({
          tokens,
          domainName,
          ...CONFIG,
        }),
        ...CONFIG.cloudFrontHeaders,
      },
    };
    CONFIG.logger.debug("Returning response:\n", response);
    return response;
  } catch (err) {
    const response = {
      body: createErrorHtml({
        title: "Refresh issue",
        message: "We can't refresh your sign-in because of a",
        expandText: "technical problem",
        details: err.toString(),
        linkUri: redirectedFromUri,
        linkText: "Try again",
      }),
      status: "200",
      headers: {
        ...CONFIG.cloudFrontHeaders,
        "content-type": [
          {
            key: "Content-Type",
            value: "text/html; charset=UTF-8",
          },
        ],
      },
    };
    CONFIG.logger.debug("Returning response:\n", response);
    return response;
  }
};

function validateRefreshRequest(
  currentNonce,
  originalNonce,
  idToken,
  accessToken,
  refreshToken
) {
  if (!originalNonce) {
    throw new Error(
      "Your browser didn't send the nonce cookie along, but it is required for security (prevent CSRF)."
    );
  } else if (currentNonce !== originalNonce) {
    throw new Error("Nonce mismatch");
  }
  Object.entries({ idToken, accessToken, refreshToken }).forEach(
    ([tokenType, token]) => {
      if (!token) {
        throw new Error(`Missing ${tokenType}`);
      }
    }
  );
}

