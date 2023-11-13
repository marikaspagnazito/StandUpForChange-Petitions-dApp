// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PetitionContract {
     uint public counterPetition;

    // Definizione della struttura della petizione
    struct Petition {
        uint id;
        string title;
        string organizer;
        string img;
        string category; 
        uint targetSignatures;
        uint numSignatures;
        bool isActive;
    }

    // Mapping degli ID delle petizioni alle loro struct Petition
    mapping(uint => Petition) public petitions;

    // Mapping degli indirizzi che hanno firmato petizioni agli ID delle petizioni firmate
    mapping(address => uint[]) public signedPetitions;

    // Evento emesso quando una petizione viene firmata
    event PetitionSigned(address indexed signer, uint indexed petitionId);
    //Evento emesso quando una petizione viene creata
    event PetitionCreated(uint indexed id, string title, string organizer, string img, 
    string category, uint targetSignatures );


    constructor() {
    	counterPetition=0;
        loadPetition();
    }
   
    function loadPetition() public {
        createPetition(1,"Basta plastica monouso: Agiamo Ora!","GreenEarth Italia", "images/petitions/plastic.png", "Ambiente", 13000,70);
        createPetition(2,"Stop alle discriminazioni sul lavoro","YourVoice","images/petitions/discriminazione.jpg", "Diritti Umani", 20000,8000);
        createPetition(3,"No ai Test su Animali: Cosmetici Cruelty-Free","CrueltyFree Beauty","images/petitions/testcosmetici.jpg", "Animali", 8000,7999);
        createPetition(4,"Sosteniamo la salute mentale studentesca","Fondazione ScuolaSana","images/petitions/salutementale.jpg", "Salute Mentale e Istruzione", 10000,758);
        createPetition(5,"Prevenzione delle epidemie globali","Global Health Initiative","images/petitions/epidemie.jpg", "Salute", 50000,28000);
        createPetition(6,"Salviamo i nostri ecosistemi marini!","Blu Coral Project","images/petitions/coral-reef.jpg", "Ambiente", 7000,5);
        createPetition(7,"Aiutiamo le famiglie monoparentali","Rete di Sostegno per Famiglie","images/petitions/famiglie.png", "Famiglia", 20000,730);
        createPetition(8,"Arte senza barriere: Musei gratis","Associazione Culturale ArteViva","images/petitions/museum.jpg", "Cultura", 7500,130);    
    }
   
    // Funzione per creare una nuova petizione
    function createPetition(
        uint id, 
        string memory title,
        string memory organizer,
        string memory img,
        string memory category, 
        uint targetSignatures, 
        uint numSignatures
    ) public {
        require(petitions[id].id == 0, "Petition with same ID already exists"); // Verifica se esiste già una petizione con lo stesso ID

        petitions[id] = Petition(
            id,
            title,
            organizer,
            img,
            category,
            targetSignatures,
            numSignatures,
            true
        );
        counterPetition++;
        // Emetti l'evento PetitionCreated
        emit PetitionCreated(id, title, organizer, img, category, targetSignatures);
    }

    // Funzione per ottenere i dettagli di una petizione
    function getPetitionDetails(uint petitionId) public view returns (
        uint id,
        string memory title,
        string memory organizer,
        string memory img,
        string memory category, 
        uint targetSignatures,
        uint numSignatures,
        bool isActive
    ) {
        Petition storage petition = petitions[petitionId];
        require(petition.id != 0, "Petition does not exist"); // Verifica se la petizione esiste
        return (
            petition.id,
            petition.title,
            petition.organizer,
            petition.img,
            petition.category,
            petition.targetSignatures,
            petition.numSignatures,
            petition.isActive
        );
    }

    // Funzione per firmare una petizione
    function signPetition(uint petitionId) public {
        Petition storage petition = petitions[petitionId];
        require(petition.isActive, "Petition is not active");

        // Controllo per verificare se l'utente ha già firmato
        require(!hasSignedPetition(msg.sender, petitionId), "You have already signed this petition");

        petition.numSignatures++;
        signedPetitions[msg.sender].push(petitionId);

        if (petition.numSignatures >= petition.targetSignatures) {
            petition.isActive = false;
        }
        emit PetitionSigned(msg.sender, petitionId);
    }

    // Funzione per verificare se un utente ha già firmato una petizione
    function hasSignedPetition(address signer, uint petitionId) internal view returns (bool) {
        uint[] storage signedIds = signedPetitions[signer];
        for (uint i = 0; i < signedIds.length; i++) {
            if (signedIds[i] == petitionId) {
                return true;
            }
        }
        return false;
    }
    
    //Funzione per ottenere tutte le petizioni
    function getAllPetitions() public view returns (Petition[] memory) {
    	Petition[] memory result = new Petition[](counterPetition);
    	for (uint i = 0; i < counterPetition; i++) {
      	    result[i] = petitions[i];
    	}

    return result;
    }	
    
    // Funzione per ottenere gli ID delle petizioni firmate da un determinato indirizzo
    function getSignedPetitionIds(address signer) public view returns (uint[] memory) {
    	uint[] memory signedIds = signedPetitions[signer];
    	return signedIds;
    }

    

    // Funzione per ottenere le petizioni firmate da un determinato indirizzo
    function getSignedPetitions(address signer) public view returns (Petition[] memory) {
        uint[] memory signedIds = signedPetitions[signer];
        Petition[] memory signedPetitionsArray = new Petition[](signedIds.length);

        for (uint i = 0; i < signedIds.length; i++) {
            signedPetitionsArray[i] = petitions[signedIds[i]];
        }
        return signedPetitionsArray;
    }
}
