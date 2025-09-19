import React from 'react';
import { ArrowLeft } from 'lucide-react';
import styles from '../../pages/Home.module.css';
import '../../styles/global.css';

interface MainMenuProps {
  balance: number;
  onStartGame: () => void;
  onShowRecords: () => void;
  onShowDictionary: () => void;
  onNavigateBack: () => void;
  playButtonClick: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  balance,
  onStartGame,
  onShowRecords,
  onShowDictionary,
  onNavigateBack,
  playButtonClick
}) => {
  return (
    <div className="app-bg">
      <div className={`${styles.screen} ${styles.framed}`}>
        {/* Кнопка "Назад" */}
        <div className="flex justify-start">
          <button
            onClick={() => {
              playButtonClick();
              onNavigateBack();
            }}
            className={styles.backButton}
            title="Назад"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        </div>

        {/* Заголовок игры */}
        <h1 className={styles.title}>
          ARTÍCULOS<br/>ROULETTE
        </h1>

        {/* Основной контент */}
        <main className={styles.center}>
          <button 
            className={styles.play}
            onClick={() => {
              playButtonClick();
              onStartGame();
            }}
          >
            JUGAR
          </button>
        </main>

        {/* Футер с балансом и кнопками */}
        <footer>
          <div className={styles.credits}>
            {balance} CRÉDITOS
          </div>

          <div className={styles.bottom}>
            <button
              className={styles.secondary}
              onClick={() => {
                playButtonClick();
                onShowRecords();
              }}
            >
              RÉCORDS
            </button>
            <button
              className={styles.secondary}
              onClick={() => {
                playButtonClick();
                onShowDictionary();
              }}
            >
              DICCIONARIO
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
