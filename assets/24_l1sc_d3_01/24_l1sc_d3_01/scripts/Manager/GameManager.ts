/**
 * 游戏逻辑类
 */

class GameManagerClass {
    private static _instance: GameManagerClass = null;

    public static getInstance(): GameManagerClass {
        if (null === this._instance) {
            this._instance = new GameManagerClass();
        }
        return this._instance;
    }
}

export const GameManager = GameManagerClass.getInstance();
