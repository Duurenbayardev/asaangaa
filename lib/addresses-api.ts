import { getApiBaseUrl, parseJsonResponse } from "./api-client";
import { getAuthHeaders } from "./auth-api";

export type AddressRecord = {
  id: string;
  fullName?: string;
  line1: string;
  line2?: string;
  city: string;
  postalCode?: string;
  instructions?: string;
};

export async function getAddresses(token: string): Promise<AddressRecord[]> {
  const res = await fetch(`${getApiBaseUrl()}/addresses`, {
    headers: getAuthHeaders(token),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw data;
  return Array.isArray(data) ? data : [];
}

export async function createAddress(
  token: string,
  body: { fullName?: string; line1: string; line2?: string; city: string; postalCode?: string; instructions?: string }
): Promise<AddressRecord> {
  const res = await fetch(`${getApiBaseUrl()}/addresses`, {
    method: "POST",
    headers: { ...getAuthHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: body.fullName,
      line1: body.line1,
      line2: body.line2,
      city: body.city,
      postalCode: body.postalCode,
      instructions: body.instructions,
    }),
  });
  const data = await parseJsonResponse(res);
  if (!res.ok) throw data;
  return data as AddressRecord;
}
