const PetitionContract = artifacts.require("PetitionContract");

contract("PetitionContract", (accounts) => {
  let petitionContract;

  beforeEach(async () => {
    petitionContract = await PetitionContract.new({ from: accounts[0] });
  });

  it("should create a new petition", async () => {
    const petitionId = 13;
    const title = "Test Petition";
    const organizer = "Test Organizer";
    const img ="/prova.jpg";
    const category = "Test Category";
    const targetSignatures = 100;
    const numSignatures = 50;

    await petitionContract.createPetition(petitionId, title, organizer, img,  category, targetSignatures, numSignatures);

    const result = await petitionContract.getPetitionDetails(petitionId);

    assert.equal(result.id, petitionId, "ID incorrect");
    assert.equal(result.title, title, "Title incorrect");
    assert.equal(result.organizer, organizer, "Organizer incorrect");
    assert.equal(result.img, img, "Image incorrect");
    assert.equal(result.category, category, "Category incorrect");
    assert.equal(result.targetSignatures, targetSignatures, "Target signatures incorrect");
    assert.equal(result.numSignatures, 50, "Number of signatures should be 50");
    assert.equal(result.isActive, true, "Petition should be active");
  });

  it("should sign a petition", async () => {
    const petitionId = 13;
    const signer = accounts[1];

    await petitionContract.createPetition(petitionId, "Test Petition", "Test Organizer","Test Image", "Test Category", 100, 20);
    
    await petitionContract.signPetition(petitionId, { from: signer });

    const signedPetitions = await petitionContract.getSignedPetitions(signer);

    assert.equal(signedPetitions.length, 1, "Should have one signed petition");

    const signedPetition = signedPetitions[0];
    assert.equal(signedPetition.id, petitionId, "Incorrect signed petition ID");
  });

  it("should not allow duplicate petitions with the same ID", async () => {
    const petitionId = 13;

    await petitionContract.createPetition(petitionId, "Test Petition", "Test Organizer", "Test Image","Test Category", 100, 20);

    try {
      await petitionContract.createPetition(petitionId, "Duplicate Petition", "Duplicate Organizer",  "Duplicate Image", "Duplicate Category", 200, 20);
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Petition with same ID already exists"), "Wrong error message");
    }
  });

  it("should not allow signing an inactive petition", async () => {
    const petitionId = 13;
    const signer = accounts[1];

    await petitionContract.createPetition(petitionId, "Test Petition", "Test Organizer",   "Test Image", "Test Category", 1, 0);
    await petitionContract.signPetition(petitionId, { from: signer });

    try {
      await petitionContract.signPetition(petitionId, { from: signer });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("Petition is not active"), "Wrong error message");
    }
  });

  it("should get signed petitions for an address", async () => {
    const petitionId1 = 13;
    const petitionId2 = 14;
    const signer = accounts[1];

    await petitionContract.createPetition(petitionId1, "Test Petition 1", "Test Organizer", "Test Image", "Test Category", 1, 0);
    await petitionContract.createPetition(petitionId2, "Test Petition 2", "Test Organizer", "Test Image", "Test Category", 1, 0);

    await petitionContract.signPetition(petitionId1, { from: signer });

    const signedPetitions = await petitionContract.getSignedPetitions(signer);

    assert.equal(signedPetitions.length, 1, "Should have one signed petition");

    const signedPetition = signedPetitions[0];
    assert.equal(signedPetition.id, petitionId1, "Incorrect signed petition ID");
  });
  
  it("should get signed petition IDs for an address", async () => {
  const petitionId1 = 13;
  const petitionId2 = 14;
  const signer = accounts[1];

  await petitionContract.createPetition(petitionId1, "Test Petition 1", "Test Organizer", "Test Image", "Test Category", 1, 0);
  await petitionContract.createPetition(petitionId2, "Test Petition 2", "Test Organizer", "Test Image", "Test Category", 1, 0);

  await petitionContract.signPetition(petitionId1, { from: signer });

  const signedPetitionIds = await petitionContract.getSignedPetitionIds(signer);

  assert.equal(signedPetitionIds.length, 1, "Should have one signed petition ID");
  assert.equal(signedPetitionIds[0], petitionId1, "Incorrect signed petition ID");
});


  it("should not allow signing an already signed petition", async () => {
    const petitionId = 13;
    const signer = accounts[1];

    await petitionContract.createPetition(petitionId, "Test Petition", "Test Organizer", "Test Image", "Test Category", 100, 20);
    await petitionContract.signPetition(petitionId, { from: signer });

    try {
      await petitionContract.signPetition(petitionId, { from: signer });
      assert.fail("Should have thrown an error");
    } catch (error) {
      assert(error.message.includes("You have already signed this petition"), "Wrong error message");
    }
  });
  

});
