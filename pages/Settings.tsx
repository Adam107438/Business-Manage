import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import Button from '../components/ui/Button';
import PasswordProtect from '../components/PasswordProtect';
import { AlertTriangle, Download } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Settings: React.FC = () => {
    const { clearData, state } = useData();
    const { user } = useAuth();
    const [isPasswordProtectOpen, setIsPasswordProtectOpen] = useState(false);

    const handleClearData = () => {
        setIsPasswordProtectOpen(true);
    };
    
    const confirmClearData = async () => {
        await clearData();
        // Optionally show a success message
        alert('All application data has been cleared from the cloud.');
    };

    const handleDownloadApp = () => {
        try {
            // Get the user's data from the current state to embed it in the file.
            const appData = JSON.stringify(state);
            
            let htmlContent = document.documentElement.outerHTML;

            if (appData && user) {
                 const scriptToInject = `
<script id="injected-data">
    try {
        // This script will run when the downloaded HTML file is opened.
        // It injects the user's data into the browser's local storage for that file,
        // allowing the app to work offline with the data from the moment it was downloaded.
        const dataString = atob('${btoa(appData)}');
        const userUID = '${user.uid}';

        // Set the data in localStorage so the app loads with it.
        // Note: The downloaded app will NOT sync with the cloud. This is an offline snapshot.
        localStorage.setItem('appData_' + userUID, dataString);

        // Also mock the user login for the offline copy
        const mockUser = { uid: userUID, email: '${user.email}' };
        localStorage.setItem('firebase_mock_user', JSON.stringify(mockUser));
        
        console.log('Offline data snapshot injected successfully.');
    } catch(e) {
        console.error('Failed to parse or restore injected data.', e);
    }
    // Self-remove this script after execution to keep the DOM clean.
    document.getElementById('injected-data').remove();
</script>
`;
                // Inject the script just before the closing body tag
                htmlContent = htmlContent.replace('</body>', `${scriptToInject}</body>`);
            }
            
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = 'inventory-accounts-manager-snapshot.html';
            document.body.appendChild(a);
            a.click();
            
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error("Failed to download the app:", error);
            alert("Sorry, there was an error downloading the app snapshot.");
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Application Management</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                    Your data is now saved in the cloud and syncs across devices. You can also download a snapshot of the application as a single HTML file to use offline. This file will contain all your data from the moment of download but will not sync with the cloud.
                </p>
                <Button onClick={handleDownloadApp}>
                    <Download className="w-5 h-5 mr-2 inline" />
                    Download Offline Snapshot
                </Button>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border-l-4 border-red-500">
                <h2 className="text-2xl font-semibold mb-4 text-red-600 dark:text-red-400">Danger Zone</h2>
                <div className="flex items-start p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <AlertTriangle className="h-6 w-6 text-red-500 mr-4 flex-shrink-0"/>
                    <div>
                        <h3 className="text-lg font-bold text-red-800 dark:text-red-300">Clear All Data</h3>
                        <p className="text-red-700 dark:text-red-400 mt-1">
                            This action is irreversible. All your data will be permanently deleted from the cloud and reset to the initial state across all your devices.
                        </p>
                        <Button variant="danger" className="mt-4" onClick={handleClearData}>
                            Clear All Application Data
                        </Button>
                    </div>
                </div>
            </div>
            
            <PasswordProtect
                isOpen={isPasswordProtectOpen}
                onClose={() => setIsPasswordProtectOpen(false)}
                onSuccess={confirmClearData}
                actionName="clear all data"
            />
        </div>
    );
};

export default Settings;