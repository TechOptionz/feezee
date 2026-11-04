/**
 * TLS for the managed Postgres connection.
 *
 * DigitalOcean's Managed Postgres presents a certificate signed by a
 * per-project CA that is not in Node's default trust store, so a plain
 * `sslmode=require` connection fails with "self-signed certificate in
 * certificate chain". Rather than disable verification — which would leave the
 * order database open to a man-in-the-middle — the CA is bundled here and handed
 * to node-postgres, so the connection is *verified* against it.
 *
 * The certificate is public: it only lets a client verify the server, never
 * authenticate as it, so committing it carries no secret. If the database
 * cluster is ever recreated, replace this with the new cluster's CA (DO →
 * cluster → Connection details → Download CA certificate).
 *
 * A local Postgres (docker-compose, no TLS) needs no `ssl` at all, so the helper
 * returns undefined for localhost and development keeps working unchanged.
 */
export const DB_CA_CERT = `-----BEGIN CERTIFICATE-----
MIIERDCCAqygAwIBAgIUadQH/NU8QThmSxrCJaxs4OO5wqcwDQYJKoZIhvcNAQEM
BQAwOjE4MDYGA1UEAwwvNmZjMDAyZTQtZDczYS00YjRjLTkzYmYtMTYzODMxYzhl
ZDEyIFByb2plY3QgQ0EwHhcNMjYxMTA0MTA0MTQ1WhcNMzYxMTAxMTA0MTQ1WjA6
MTgwNgYDVQQDDC82ZmMwMDJlNC1kNzNhLTRiNGMtOTNiZi0xNjM4MzFjOGVkMTIg
UHJvamVjdCBDQTCCAaIwDQYJKoZIhvcNAQEBBQADggGPADCCAYoCggGBAMX1/0Qm
Z3EhvXJ8PvHggepCd0M3pqp30MsyNUtuM9QDILbmssygzII76nhgoG6QUGNOsnZV
xzKqdC8Zxi4a2afNDMzmPCluf2roUDnbXFyQY0+F0w8f9m+i34ifhg4ANdP8TOeo
0fOsDwH+khF9vTzw4Pdf8H1quiocTchrbuc1mLlGnGEiQvcbgjPIwKZO83i8XoSw
cIdZOD6qS1R6tGNJRUine68suN9sfDS/YkFIQ9yD3SOsu/v/eCaUNCMI5Ec2urR2
B1XdfRaOD9WC7pyXFPhSGbMSMSl6cxCWRACwzpr6u2I3KmXRkAmVWm2t/0HZMbae
kRlHhgi6sX6l1AXh9dS5G/YE97bTTr4Hkm+sfJrnpBrNTv2za4C6MFQC0LWG5F8D
+NsRltO5Dr4n5OpYGsPSQXodpajHPc6oqxi/pbF2E4kplulz7BL4l6ccL5arFEws
1yG+reKdvx0kqvvKCHU7sF2p8g2wK41rhn63dOqba2tOD+nUmFsxuQ7nawIDAQAB
o0IwQDAdBgNVHQ4EFgQUd+3ErfXh34cH18MSiAow7sNP2QowEgYDVR0TAQH/BAgw
BgEB/wIBADALBgNVHQ8EBAMCAQYwDQYJKoZIhvcNAQEMBQADggGBAJ3f18T4WWU+
kRmxbJt9wt7eH9qUU0pIwhyusxto/VE3qBm7g8iFrSeTcQM3eG1makVnRdWjT2Sh
Bxdn6lcwcpOl9+uMiSOUbsYslyXKs5ye+DdqPIeZKP4PYliy9Ntc5pP47OVpRRQr
iufWAHhL2LDGJiGz8YOUZwayxSl3iI37hiM00r9JNQLhTZaAv2Id2s3iyhmRe35j
0L8/qEv1J5Il6FLhJap5DEZwNRawmI6e2xFbk9IExJzU12ODyPeBvxg6wBbXdFxu
eFc0c41lu2R3riu5gF2pSE+2chzj2W17m/ClT5T557k7kSgTN7DTb4pYE1XH/JKE
4OYYDXOQKHhRxciz7LUESfdp4AZufeqJzOkc9ykFThZOWq7bZhjFRWY0noj9NKP3
Jetvt2vyozzvAsjwrlGZR3WnUX2QAj/nCP7iFrnPu9SMSieyeEJeAAynt0eawVmL
hRlRF7lrM0U8uRcCxx38tF5Z1X+qaQlYrOWeqa/tuL7n+u6Q2iP3zg==
-----END CERTIFICATE-----`;

type DbSsl = { ca: string; rejectUnauthorized: true };

/**
 * node-postgres connection config, CA-verified for a managed host.
 *
 * The ssl-related query parameters are stripped from the connection string and
 * replaced with an explicit `ssl` object. This matters: if `sslmode=require` is
 * left in the string, node-postgres verifies against the *default* trust store
 * and rejects DO's CA before our `ssl` object is consulted. Removing it hands
 * TLS entirely to the `ssl` option, which verifies against the bundled CA.
 *
 * A local Postgres (localhost/loopback, no TLS) keeps its string untouched and
 * gets no `ssl`, so development is unchanged.
 */
export function dbConnection(connectionString: string | undefined): {
  connectionString: string | undefined;
  ssl?: DbSsl;
} {
  if (!connectionString) return { connectionString };

  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    return { connectionString };
  }

  const host = url.hostname;
  if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
    return { connectionString };
  }

  for (const param of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) {
    url.searchParams.delete(param);
  }

  return {
    connectionString: url.toString(),
    ssl: { ca: DB_CA_CERT, rejectUnauthorized: true },
  };
}
