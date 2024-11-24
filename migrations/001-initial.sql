--------------------------------------------------------------------------------
-- Up
--------------------------------------------------------------------------------

CREATE TABLE bans (
    id   INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    username TEXT NOT NULL,
    reason TEXT NOT NULL
);

CREATE TABLE strings (
    id   INTEGER PRIMARY KEY,
    action TEXT CHECK ( action IN ('delete', 'ban') ) NOT NULL DEFAULT 'delete',
    value TEXT NOT NULL
);

--------------------------------------------------------------------------------
-- Down
--------------------------------------------------------------------------------

DROP TABLE bans;
DROP TABLE strings;
