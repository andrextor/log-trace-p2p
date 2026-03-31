import { P2PParserEngine } from "@andrextor_ia11012/p2p-log-parser";

const logData = `1774921157476	2026-03-31T01:39:17.476Z	{"message":"Request trace POST /api/session/7532375","context":{"TENANT_DOMAIN":"checkout.getnet.cl","session_id":7532375,"action_method":"sessionInformation","body":{"auth":{"login":"vz3gNGDF8UKbfuRPA4u1tLes8KQqR59Z"},"browser":"RestSharp","platform":null,"version":"106.15.0.0"},"aws_request_id":"835b702e-bdf8-4423-b427-c8c86afb156c"},"level":200,"level_name":"INFO","channel":"production","datetime":"2026-03-31T01:39:17.439379+00:00","extra":{"tenantId":2}}`;

const engine = new P2PParserEngine();
const result = engine.parse(logData, "checkout");
console.log(JSON.stringify(result.events[0], null, 2));
