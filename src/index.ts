import express from 'express';
import bodyParser from "body-parser";
import { Request, Response } from "express";
import { Collection, ObjectId } from "mongodb";
import Account from "./model";

import { connectToDatabase, db } from "./database"

const router = express.Router();
router.use( express.json() );

const app = express();

app.use( bodyParser.urlencoded({ extended: false }) );
app.use( bodyParser.json() );

const PORT = process.env.PORT || 3001;


async function main() {

	await connectToDatabase().catch((error: Error) => {
		console.error("Database connection failed", error);
		process.exit();
	});

	let accounts : Collection<Account> = db.collection<Account>( process.env.ACCOUNTS_COLLECTION_NAME as string );

	await db.command({
		"collMod": process.env.ACCOUNTS_COLLECTION_NAME,
		"validator": {
			$jsonSchema: {
				bsonType: "object",
				required: ["username", "passwordHash", "tracks"],
				additionalProperties: false,
				properties: {
					_id: {},
					username: {
						bsonType: "string",
						description: "'username' is required and is a string"
					},
					passwordHash: {
						bsonType: "string",
						description: "'passwordHash' is required and is a string"
					},
					tracks: {
						bsonType: "array",
						description: "'tracks' is required and is an array"
					}
				}
			}
		}
	});

	app.listen(PORT, () => {
		console.log(`Server started at http://localhost:${PORT}`);
	});

	app.post( "/get_or_create/:username", async ( request, response ) => {

		let passwordHash = request.body.passwordHash;
		let account = await accounts.findOne( { username : request.params.username } ) as Account;
		if ( account == null ) {
			account = {
				username : request.params.username,
				passwordHash : passwordHash,
				tracks : []
			};
			let insertOne = await accounts.insertOne( account );
			account._id = insertOne.insertedId;
		} else {
			if ( account.passwordHash != passwordHash ) {
				response.status( 403 ).json( {
					result : false,
					error: "wrong password"
				} );
				return;
			}
		}
		delete account.passwordHash;
		console.log( account );
		addHeaders(
			response.json( { result : true, account } )
		);
	});

	function addHeaders ( response:any ) {
		return response.header( 'Access-Control-Allow-Origin: *' );
	}

	app.post( "/update/:username/", async ( request, response ) => {
		let updateOne = await accounts.updateOne( {
			username : request.params.username,
			passwordHash : request.body.passwordHash
		}, {
			$set : {
				tracks : request.body.tracks
			}
		});

		addHeaders(
			response.json( { result : updateOne.matchedCount != 0 } )
		);
	});
};

main();