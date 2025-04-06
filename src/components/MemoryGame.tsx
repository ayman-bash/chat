import React, { useEffect, useRef } from 'react';
import Phaser from 'phaser';

interface MemoryGameProps {
  onClose: () => void; // Callback to close the game
}

export const MemoryGame: React.FC<MemoryGameProps> = ({ onClose }) => {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameContainerRef.current) return;

    // Phaser game configuration
    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameContainerRef.current,
      scene: {
        preload,
        create,
        update,
      },
    };

    // Initialize Phaser game
    gameRef.current = new Phaser.Game(config);

    return () => {
      // Destroy the game instance on component unmount
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  // Preload assets
  const preload = function (this: Phaser.Scene) {
    this.load.image('back', '/assets/backs.png'); // Back of the card
    this.load.image('beans', '/assets/beans.png'); // Ensure this matches the filename
    this.load.image('legumes', '/assets/legumes.png'); // Ensure this matches the filename
    this.load.image('lentils', '/assets/lentils.png'); // Ensure this matches the filename
    this.load.image('pea', '/assets/pea.png'); // Ensure this matches the filename
    this.load.image('peas', '/assets/peas.png'); // Ensure this matches the filename
    this.load.image('platlegume', '/assets/platlegume.png');
    this.load.image('platlegume', '/assets/back.png'); // Ensure this matches the filename
  };

  // Create the game scene
  const create = function (this: Phaser.Scene) {
    const cardImages = [
      'beans',
      'legumes',
      'lentils',
      'pea',
      'peas',
      'platlegume',
    ]; // Ensure these keys match the keys in the preload function
    const cards = Phaser.Utils.Array.Shuffle([...cardImages, ...cardImages]); // Duplicate and shuffle

    const cardWidth = 100; // Adjusted card size
    const cardHeight = 150;
    const margin = 15; // Margin between cards
    const cols = 4;
    const rows = Math.ceil(cards.length / cols);

    const gridWidth = cols * (cardWidth + margin) - margin;
    const gridHeight = rows * (cardHeight + margin) - margin;

    const offsetX = (this.scale.width - gridWidth) / 2; // Center the grid horizontally
    const offsetY = (this.scale.height - gridHeight) / 2; // Center the grid vertically

    let firstCard: Phaser.GameObjects.Sprite | null = null;
    let secondCard: Phaser.GameObjects.Sprite | null = null;
    let matches = 0;

    const playerName = 'Joueur 1'; // Replace with dynamic player name if available

    cards.forEach((card, index) => {
      const x = offsetX + (index % cols) * (cardWidth + margin) + cardWidth / 2;
      const y = offsetY + Math.floor(index / cols) * (cardHeight + margin) + cardHeight / 2;

      const cardSprite = this.add.sprite(x, y, 'back').setInteractive();
      cardSprite.setDisplaySize(cardWidth, cardHeight); // Ensure the card fits within its frame
      cardSprite.setData('value', card);

      cardSprite.on('pointerdown', () => {
        if (firstCard && secondCard) return; // Ignore clicks if two cards are already flipped

        cardSprite.setTexture(card); // Flip the card
        cardSprite.setDisplaySize(cardWidth, cardHeight); // Ensure the flipped card fits within its frame
        cardSprite.setData('flipped', true);

        if (!firstCard) {
          firstCard = cardSprite;
        } else {
          secondCard = cardSprite;

          // Check for a match
          if (firstCard.getData('value') === secondCard.getData('value')) {
            matches++;
            firstCard = null;
            secondCard = null;

            // Check for game completion
            if (matches === cardImages.length) {
              this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 - 50,
                `Bien joué, ${playerName} !`,
                {
                  fontSize: '32px',
                  color: '#00ff00',
                  fontStyle: 'bold',
                }
              ).setOrigin(0.5);

              this.add.text(
                this.scale.width / 2,
                this.scale.height / 2 + 20,
                'Rejouer',
                {
                  fontSize: '24px',
                  color: '#ffffff',
                  backgroundColor: '#007bff',
                  padding: { x: 10, y: 5 },
                }
              )
                .setOrigin(0.5)
                .setInteractive()
                .on('pointerdown', () => {
                  this.scene.restart(); // Restart the game
                });
            }
          } else {
            // Flip cards back after a delay
            this.time.delayedCall(1000, () => {
              firstCard?.setTexture('back').setDisplaySize(cardWidth, cardHeight).setData('flipped', false);
              secondCard?.setTexture('back').setDisplaySize(cardWidth, cardHeight).setData('flipped', false);
              firstCard = null;
              secondCard = null;
            });
          }
        }
      });
    });
  };

  // Update the game scene
  const update = function (this: Phaser.Scene) {
    // Game logic updates (if needed)
  };

  return (
    <div
      ref={gameContainerRef}
      className="w-full h-full bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-lg shadow-2xl overflow-hidden relative flex items-center justify-center"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 shadow-md transition-all"
      >
        &times;
      </button>
    </div>
  );
};
