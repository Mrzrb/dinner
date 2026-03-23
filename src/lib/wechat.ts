const WECHAT_APPID = process.env.WECHAT_APPID!;
const WECHAT_SECRET = process.env.WECHAT_SECRET!;

export interface WxAccessTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  openid: string;
  scope: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WxUserInfoResponse {
  openid: string;
  nickname: string;
  sex: number;
  province: string;
  city: string;
  country: string;
  headimgurl: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

export function getWxAuthorizeUrl(redirectUri: string, state: string = ""): string {
  const encodedUri = encodeURIComponent(redirectUri);
  return (
    `https://open.weixin.qq.com/connect/oauth2/authorize` +
    `?appid=${WECHAT_APPID}` +
    `&redirect_uri=${encodedUri}` +
    `&response_type=code` +
    `&scope=snsapi_userinfo` +
    `&state=${state}` +
    `#wechat_redirect`
  );
}

export async function getWxAccessToken(code: string): Promise<WxAccessTokenResponse> {
  const url =
    `https://api.weixin.qq.com/sns/oauth2/access_token` +
    `?appid=${WECHAT_APPID}` +
    `&secret=${WECHAT_SECRET}` +
    `&code=${code}` +
    `&grant_type=authorization_code`;

  const res = await fetch(url);
  return res.json();
}

export async function getWxUserInfo(
  accessToken: string,
  openid: string
): Promise<WxUserInfoResponse> {
  const url =
    `https://api.weixin.qq.com/sns/userinfo` +
    `?access_token=${accessToken}` +
    `&openid=${openid}` +
    `&lang=zh_CN`;

  const res = await fetch(url);
  return res.json();
}

export function isWeChatBrowser(userAgent: string): boolean {
  return /MicroMessenger/i.test(userAgent);
}
