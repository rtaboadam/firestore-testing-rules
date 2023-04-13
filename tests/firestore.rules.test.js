const firebase = require("@firebase/testing");
const assert = require("chai").assert;
const sinon = require("sinon");
const fs = require("fs");
const path = require("path");

const MY_PROJECT_ID = "test-project";
const rules = fs.readFileSync(
    path.resolve(__dirname, "../firestore.rules"),
    "utf8"
);

/**
 * Returns a test database.
 * @typedef { {uid: string, token: object} } FUser
 * @param {FUser} auth 
 * @returns firebase.firestore.Firestore
 */
function getFirestore(auth) {
    return firebase
        .initializeTestApp({
            projectId: MY_PROJECT_ID,
            auth: auth,
        })
        .firestore();
}

describe("Firestore security rules", () => {
   
    before(async () => {
        await firebase.loadDatabaseRules({
            databaseName: MY_PROJECT_ID,
            rules: rules,
        });
    });

    afterEach(async () => {
        await firebase.clearFirestoreData({ projectId: MY_PROJECT_ID });
    });

    after(async () => {
        await Promise.all(
            firebase.apps().map((app) => app.delete())
        );
    });

    describe("Chats collection", () => {
        it("should not allow write if document exists", async () => {
            const db = getFirestore(null);
            const testDoc = db.collection("chats").doc("existing-chat");
            // This should allow, but the next set doesn't
            await firebase.assertSucceeds(testDoc.set({ some: "data" }));

            const authenticatedDb = getFirestore({ uid: "user123" });
            const testDoc2 = authenticatedDb.collection("chats").doc("existing-chat");
            
            await firebase.assertFails(testDoc2.set({some: "other-data"}))
        });
    });
    
    describe("other collections", () => {
        it("should not allow read or write", async () => {
            const db = getFirestore(null);
            const testDoc = db.collection("other-collection").doc("test-doc");

            await firebase.assertFails(testDoc.get());
            await firebase.assertFails(testDoc.set({ some: "data"}));
        });
    });
})
