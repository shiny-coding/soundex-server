import express from 'express';
import bodyParser from "body-parser";
import { Collection } from "mongodb";
import Account from "./model";

import { connectToDatabase, db } from "./database"

const router = express.Router();
router.use( express.json() );

const app = express();

app.use( ( req, res, next ) => {
    res.append('Access-Control-Allow-Origin', ['*']);
    res.append('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.append('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.use( bodyParser.urlencoded({ extended: false }) );
app.use( bodyParser.json() );

const PORT = process.env.PORT || 3001;

async function main() {

	await connectToDatabase().catch((error: Error) => {
		console.error( "Database connection failed", error );
		process.exit();
	});

	let accounts : Collection<Account> = db.collection<Account>( process.env.ACCOUNTS_COLLECTION_NAME as string );

	await db.command( {
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
	} );

	app.listen( PORT, () => {
		console.log(`Server started at http://localhost:${PORT}`);
	} );

	app.post( "/login_or_register", async ( request, response ) => {

		let { username, passwordHash } = request.body;
		if ( username.trim() == '' ) {
			response.status( 403 ).json( {
				result : false,
				error: "empty username"
			} );
			return;
		}
		let account = await accounts.findOne( { username } ) as Account;
		if ( account == null ) {
			account = {
				username,
				passwordHash,
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
		console.log( account );
		response.json( { result : true, account } );
	});

	app.post( "/update", async ( request, response ) => {
		let { username, passwordHash } = request.body;
		let tracks = JSON.parse( request.body.tracks );
		let updateOne = await accounts.updateOne( { username, passwordHash }, {
			$set : { tracks }
		});

		response.json( { result : updateOne.matchedCount != 0 } );
	});
};

main();