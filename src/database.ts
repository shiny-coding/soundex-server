import * as mongoDB from "mongodb";
import * as dotenv from "dotenv";

export var db: mongoDB.Db;

export async function connectToDatabase () {
	dotenv.config();

	if ( process.env.DB_CONN_STRING === undefined ) {
		throw "DB_CONN_STRING is not defined";
	}
	const client: mongoDB.MongoClient = new mongoDB.MongoClient(process.env.DB_CONN_STRING);

	await client.connect();

	db = client.db(process.env.DB_NAME);

	console.log(`Successfully connected to database: ${db.databaseName}`);
}