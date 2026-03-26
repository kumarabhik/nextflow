import { serverEnv } from "@/lib/env";

const TRANSLOADIT_API_BASE = "https://api2.transloadit.com";
const COMPLETED_STATES = new Set(["ASSEMBLY_COMPLETED"]);
const FAILED_STATES = new Set([
  "ASSEMBLY_ABORTED",
  "ASSEMBLY_CANCELED",
  "ASSEMBLY_ERROR",
  "REQUEST_ABORTED",
  "REQUEST_ERROR",
]);

type TransloaditFileInfo = {
  mime?: string;
  name?: string;
  size?: number;
  ssl_url?: string;
};

type TransloaditAssemblyResponse = {
  assembly_id?: string;
  assembly_ssl_url?: string;
  error?: string;
  message?: string;
  ok?: string;
  results?: Record<string, TransloaditFileInfo[] | undefined>;
  uploads?: TransloaditFileInfo[];
};

export class TransloaditUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransloaditUploadError";
  }
}

export type TransloaditUploadedAsset = {
  assetId: string;
  assetUrl: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

function assertTransloaditCredentials() {
  if (!serverEnv.TRANSLOADIT_AUTH_KEY || !serverEnv.TRANSLOADIT_AUTH_SECRET) {
    throw new TransloaditUploadError(
      "Transloadit credentials are missing. Add TRANSLOADIT_AUTH_KEY and TRANSLOADIT_AUTH_SECRET.",
    );
  }
}

async function getTransloaditBearerToken() {
  assertTransloaditCredentials();

  const credentials = Buffer.from(
    `${serverEnv.TRANSLOADIT_AUTH_KEY}:${serverEnv.TRANSLOADIT_AUTH_SECRET}`,
  ).toString("base64");
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    scope: "assemblies:read assemblies:write",
  });
  const response = await fetch(`${TRANSLOADIT_API_BASE}/token`, {
    body,
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new TransloaditUploadError(
      `Transloadit token request failed with status ${response.status}.`,
    );
  }

  const payload = (await response.json()) as { access_token?: string };

  if (!payload.access_token) {
    throw new TransloaditUploadError(
      "Transloadit did not return an access token.",
    );
  }

  return payload.access_token;
}

async function fetchAssembly(
  assemblyUrl: string,
  accessToken: string,
): Promise<TransloaditAssemblyResponse> {
  const response = await fetch(assemblyUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: "GET",
  });

  if (!response.ok) {
    throw new TransloaditUploadError(
      `Transloadit assembly polling failed with status ${response.status}.`,
    );
  }

  return (await response.json()) as TransloaditAssemblyResponse;
}

async function waitForAssemblyCompletion(
  assemblyUrl: string,
  accessToken: string,
) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const assembly = await fetchAssembly(assemblyUrl, accessToken);

    if (assembly.ok && COMPLETED_STATES.has(assembly.ok)) {
      return assembly;
    }

    if (assembly.ok && FAILED_STATES.has(assembly.ok)) {
      throw new TransloaditUploadError(
        assembly.message ??
          assembly.error ??
          "Transloadit assembly failed before completion.",
      );
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 750);
    });
  }

  throw new TransloaditUploadError(
    "Timed out while waiting for Transloadit to finish the upload.",
  );
}

function resolveUploadedFile(assembly: TransloaditAssemblyResponse) {
  const originalResult = assembly.results?.[":original"]?.[0];
  const upload = assembly.uploads?.[0];
  const file = originalResult ?? upload;

  if (!file?.ssl_url) {
    throw new TransloaditUploadError(
      "Transloadit finished, but no uploaded file URL was returned.",
    );
  }

  return file;
}

export async function uploadTransloaditFile(
  file: File,
): Promise<TransloaditUploadedAsset> {
  const accessToken = await getTransloaditBearerToken();
  const formData = new FormData();

  formData.set(
    "params",
    JSON.stringify({
      auth: {
        key: serverEnv.TRANSLOADIT_AUTH_KEY,
      },
      steps: {
        ":original": {
          robot: "/upload/handle",
        },
      },
    }),
  );
  formData.set("file", file, file.name);

  const response = await fetch(`${TRANSLOADIT_API_BASE}/assemblies`, {
    body: formData,
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    method: "POST",
  });

  if (!response.ok) {
    throw new TransloaditUploadError(
      `Transloadit upload failed with status ${response.status}.`,
    );
  }

  const assembly = (await response.json()) as TransloaditAssemblyResponse;
  const assemblyUrl =
    assembly.assembly_ssl_url ??
    (assembly.assembly_id
      ? `${TRANSLOADIT_API_BASE}/assemblies/${assembly.assembly_id}`
      : undefined);

  if (!assemblyUrl) {
    throw new TransloaditUploadError(
      "Transloadit did not return an assembly URL.",
    );
  }

  const completedAssembly = COMPLETED_STATES.has(assembly.ok ?? "")
    ? assembly
    : await waitForAssemblyCompletion(assemblyUrl, accessToken);
  const uploadedFile = resolveUploadedFile(completedAssembly);

  return {
    assetId: completedAssembly.assembly_id ?? crypto.randomUUID(),
    assetUrl: uploadedFile.ssl_url!,
    fileName: uploadedFile.name ?? file.name,
    mimeType: uploadedFile.mime ?? (file.type || "application/octet-stream"),
    sizeBytes: uploadedFile.size ?? file.size,
  };
}
