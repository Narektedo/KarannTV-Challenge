import React from 'react';

const LoadingIndicator = ({ isLoading, isPreloading }) => {
  if (!isLoading && !isPreloading) return null;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg text-center">
        {isPreloading ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold dark:text-white">Première visite pour ce joueur</p>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Nous récupérons et stockons ses données pour la première fois.<br />
              Veuillez patienter, cela peut prendre un moment...
            </p>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mx-auto mb-3"></div>
            <p className="text-base dark:text-white">Chargement des données...</p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoadingIndicator;