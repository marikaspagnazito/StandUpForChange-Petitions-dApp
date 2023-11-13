App = {
    web3Provider: null,
    contracts: {},

    init: async function () {

        return await App.initWeb3();
    },

    initWeb3: async function () {
        // Modern dapp browsers...
        if (window.ethereum) {
            App.web3Provider = window.ethereum;
            try {
                // Request account access
                await window.ethereum.request({ method: "eth_requestAccounts" });;
            } catch (error) {
                // User denied account access...
                console.error("User denied account access")
            }
        }
        // Legacy dapp browsers...
        else if (window.web3) {
            App.web3Provider = window.web3.currentProvider;
        }
        // If no injected web3 instance is detected, fall back to Ganache
        else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
        }
        web3 = new Web3(App.web3Provider);

        return App.initContract();
    },

    initContract: function () {
        $.getJSON('PetitionContract.json', function (data) {
            // Get the necessary contract artifact file and instantiate it with truffle-contract
            var PetitionArtifact = data;
            App.contracts.PetitionContract = TruffleContract(PetitionArtifact);

            // Set the provider for our contract
            App.contracts.PetitionContract.setProvider(App.web3Provider);

            loadPetitions();
            loadSignedPetitions();
        });

        return App.bindEvents();
    },



    bindEvents: function () {
        $(document).on('click', '.btn-sign', App.handleSign);
        $(document).on('click', '.btn-addPetition', App.handleAddPetition);
    },

    // Handle petition signing
    handleSign: function (event) {
        event.preventDefault();

        var petitionId = parseInt($(event.target).data('id'));

        var petitionInstance;

        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.PetitionContract.deployed().then(function (instance) {
                petitionInstance = instance;

                // Execute sign as a transaction by sending account
                return petitionInstance.signPetition(petitionId, { from: account });
            }).then(function (result) {
                alert("Petizione firmata");
                 window.location.reload();
            }).catch(function (err) {
                if (err.message.includes("You have already signed this petition")) {
                    alert("Petizione non firmata: Hai già firmato questa petizione");
                } else {
                    alert("Petizione non firmata");
                    console.log(err.message);
                }
            });
        });
    },

    // Handle adding a new petition
    handleAddPetition: function (event) {
        event.preventDefault();

        var title = titleInput.value;
        var category = categoryInput.value;
        var organizer = organizerInput.value;
        var targetSignatures = targetSignaturesInput.value;
        var numSignatures = 0;
        var image = imageInput.value;

        // Verifica se almeno uno dei campi è vuoto
        if (title === '' || category === '' || organizer === '' || targetSignatures === '' || image === '') {
            alert("Inserisci tutti i campi!");
            return; // Esce dalla funzione in caso di campi vuoti
        }
        web3.eth.getAccounts(function (error, accounts) {
            if (error) {
                console.log(error);
            }

            var account = accounts[0];

            App.contracts.PetitionContract.deployed().then(function (instance) {
                petitionInstance = instance;

                return petitionInstance.counterPetition();
            }).then(function (counterpetitions) {
                console.log(counterpetitions);

                var petitionId = parseInt(counterpetitions) + 1;
                console.log(petitionId);

                return petitionInstance.createPetition(petitionId, title, organizer, image, category, targetSignatures, numSignatures, { from: account });
            }).then(function (result) {
                alert("Petizione aggiunta!");
                // Resetta i campi del form
    		titleInput.value = '';
    		categoryInput.value = '';
    		organizerInput.value = '';
    		targetSignaturesInput.value = '';
    		imageInput.value = '';
                window.location.reload();
            }).catch(function (err) {
                alert("Petizione non aggiunta!");
                console.log(err.message);
            });
        });
    }


};





$(function () {
    $(window).load(function () {
        App.init();
    });
});

// Load all petitions
function loadPetitions() {
    let petitionInstance;
    var petitionRow = $('#petitionRow');
    var petitionTemplate = $('#petitionTemplate');

    web3.eth.getAccounts(function (error, accounts) {
        if (error) {
            console.log(error);
        }

        App.contracts.PetitionContract.deployed().then(function (instance) {
            petitionInstance = instance;

            var account = accounts[0];

            return petitionInstance.counterPetition();
        }).then(function (counterpetitions) {
            console.log(counterpetitions);

            for (var i = 1; i <= counterpetitions; i++) {
                petitionInstance.petitions(i).then(function (petition) {
                    var id = petition[0];
                    var title = petition[1];
                    var organizer = petition[2];
                    var image = petition[3];
                    var category = petition[4];
                    var targetSignatures = petition[5];
                    var numSignatures = petition[6];
                    var active = petition[7];

                    petitionTemplate.find('.title').text(title);
                    petitionTemplate.find('.organizer').text(organizer);
                    petitionTemplate.find('img').attr('src', image);
                    petitionTemplate.find('.numSignatures').text(numSignatures);
                    petitionTemplate.find('.targetSignatures').text(targetSignatures);
                    petitionTemplate.find('.category').text(category);

                    if (active) {
                        petitionTemplate.find('.btn-sign').show();
                        petitionTemplate.find('.btn-success').hide();
                        petitionTemplate.find('.btn-sign').attr('data-id', id);
                    } else {
                        petitionTemplate.find('.btn-sign').hide();
                        petitionTemplate.find('.btn-success').show();
                    }

                    petitionRow.append(petitionTemplate.html());
                });
            }
        }).catch(function (err) {
            console.log(err.message);
            console.log('Errore');
        });
    });
}

// Load signed petitions for the current account
function loadSignedPetitions() {
    let petitionInstance;
    var petitionSigned = $("#petitionSigned");
    var tablepetitionsigend = $("#tablepetitionsigend");
    var emptyImage = $("#emptyImage");

    web3.eth.getAccounts(function (error, accounts) {
        if (error) {
            console.log(error);
        }

        App.contracts.PetitionContract.deployed().then(async function (instance) {
            petitionInstance = instance;

            var account = accounts[0];

            // Execute getSignedPetitionIds
            const signedPetitionIds = await petitionInstance.getSignedPetitionIds(account);

            if (signedPetitionIds.length === 0) {
                // Se signedPetitionIds è vuoto, nascondi la tabella e mostra l'immagine
                petitionSigned.hide();
                tablepetitionsigend.hide();
                emptyImage.show();
                return;
            }
            // Iterate through signed petition IDs
            for (var i = 0; i < signedPetitionIds.length; i++) {
                // Execute getPetitionDetails for each signed petition
                const petitionId = signedPetitionIds[i].toNumber();
                const petitionDetails = await petitionInstance.getPetitionDetails(petitionId);

                var id = petitionDetails[0];
                var title = petitionDetails[1];
                var organizer = petitionDetails[2];
                var image = petitionDetails[3];
                var targetSignatures = petitionDetails[5];
                var numSignatures = petitionDetails[6];
                var active = petitionDetails[7];

                var status = active ? "ATTIVA" : "COMPLETATA";

                var petitionTemplate = "<tr><th>" + id + "</th><td><img src='" + image + "' alt='" + title + "' style='width: 300px; height: 200px;'></td><td>" + title + "</td><td>" + organizer + "</td><td>" + targetSignatures + "</td><td>" + numSignatures + "</td><td>" + status + "</td></tr>";

                petitionSigned.append(petitionTemplate);

            }
        }).catch(function (err) {
            console.log(err.message);
            console.log('Errore');
        });
    });
}


