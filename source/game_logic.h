#ifndef BB_GAME_LOGIC
#define BB_GAME_LOGIC

#include <unistd.h>

#include "bbnetlib.h"

#define MAX_CREDENTIAL_LEN   64
#define MAX_RESOURCES_IN_INV 128

typedef struct Resource Resource;
typedef struct Player Player;
typedef struct Gamestate Gamestate;
// All injuries are followed immediately by their 
// healed counterparts.
typedef enum {
    INJURY_NOTHING,
    INJURY_DEEP_CUT,
    INJURY_BIG_SCAR,
    INJURY_BROKEN_LEFT_LEG,
    INJURY_BROKEN_RIGHT_LEG,
    INJURY_BROKEN_RIGHT_ARM,
    INJURY_BROKEN_LEFT_ARM,
    INJURY_MISSING_LEFT_LEG,
    INJURY_MISSING_RIGHT_LEG,
    INJURY_MISSING_LEFT_ARM,
    INJURY_MISSING_RIGHT_ARM,
    INJURY_COUNT
}InjuryType;

// These ID's will be direct
// callbacks to handle these encounters
// serverside
typedef enum {
    ENCOUNTER_BANDITS,
    ENCOUNTER_TROLLS,
    ENCOUNTER_WOLVES,
    ENCOUNTER_RATS,
    ENCOUNTER_BEGGAR,
    ENCOUNTER_DRAGONS,
    ENCOUNTER_TREASURE_SMALL,
    ENCOUNTER_TREASURE_LARGE,
    ENCOUNTER_TREASURE_MAGICAL,
    ENCOUNTER_RUINS_OLD,
    ENCOUNTER_SPELL_TOME,
    ENCOUNTER_CULTISTS_CANNIBAL,
    ENCOUNTER_CULTISTS_PEACEFUL,
    ENCOUNTER_COUNT
}EncounterID;

typedef enum {
    ENCOUNTER_TYPE_BANDIT,
    ENCOUNTER_TYPE_BEASTS,
    ENCOUNTER_TYPE_MONSTROSITIES,
    ENCOUNTER_TYPE_DRAGON,
    ENCOUNTER_TYPE_MYSTICAL,
    ENCOUNTER_TYPE_CULTISTS,
    ENCOUNTER_TYPE_SLAVERS,
    ENCOUNTER_TYPE_REFUGEES,
    ENCOUNTER_TYPE_EXILES,
    ENCOUNTER_TYPE_PLAGUE,
    ENCOUNTER_TYPE_COUNT
}EncounterTypeID;

typedef enum {
    RESOURCE_KNIFE,
    RESOURCE_SWORD,
    RESOURCE_AXE,
    RESOURCE_POTION_HEAL,
    RESOURCE_COUNT
} ResourceID;

struct Gamestate {
    // Who's turn is it
    int   playerTurn;
    // Map weights for different
    // encounter types in which regions

};

struct Player {
    int        playerID;
    char       playerName [MAX_CREDENTIAL_LEN];
    char       password   [MAX_CREDENTIAL_LEN];
    Host       associatedHost;
    int        xCoord;
    int        yCoord;
    // How many of each ResourceID the player has
    int        resources  [RESOURCE_COUNT];
};

void handleGameMessage(char *data, ssize_t dataSize, Host remotehost);

#endif
