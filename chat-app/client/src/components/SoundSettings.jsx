import React, { useState } from 'react';

const SoundSettings = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [browserNotifications, setBrowserNotifications] = useState(true);

  const testSound = () => {
    // Test notification sound
    const audio = new Audio('/notification.mp3');
    audio.play().catch(() => {
      // Fallback beep
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = 800;
      gainNode.gain.value = 0.1;
      
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);
    });
  };

  const requestBrowserNotifications = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setBrowserNotifications(permission === 'granted');
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
        title="Sound Settings"
      >
        🔔
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 p-4 z-50">
          <h3 className="font-semibold text-gray-800 mb-3">Notification Settings</h3>
          
          <div className="space-y-3">
            {/* Sound Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Notification Sounds</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={() => setSoundEnabled(!soundEnabled)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {/* Browser Notifications */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-700">Browser Notifications</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={browserNotifications}
                  onChange={() => {
                    if (!browserNotifications) {
                      requestBrowserNotifications();
                    } else {
                      setBrowserNotifications(false);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
              </label>
            </div>

            {/* Test Sound Button */}
            <button
              onClick={testSound}
              disabled={!soundEnabled}
              className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
            >
              Test Sound
            </button>

            {/* Browser Notification Status */}
            {'Notification' in window && (
              <div className="text-xs text-gray-500">
                Permission: {Notification.permission}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SoundSettings;