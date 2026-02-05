type JsonPrimative = string | number | boolean | null;
type JsonArray = Json[];
export type JsonObject = { [key: string]: Json };
type JsonComposite = JsonArray | JsonObject;
export type Json = JsonPrimative | JsonComposite;
