// Group Management Modal - Add this to TransportPage.tsx

// ==================== Group CRUD Handlers ====================
// Add these handlers after handleDeleteEmployee

const handleAddGroup = async () => {
    if (!newGroup.name || !newGroup.shift) return;
    try {
        await window.api.db.addTransportGroup({ group: newGroup });
        setIsGroupModalOpen(false);
        setNewGroup({ name: '', shift: '9H', mon: false, tue: false, wed: false, thu: false, fri: false, sat: false, sun: false });
        loadGroups();
    } catch (error) {
        console.error('Failed to add group:', error);
    }
};

const handleUpdateGroup = async () => {
    if (!currentGroup || !currentGroup.id) return;
    try {
        await window.api.db.updateTransportGroup({ id: currentGroup.id, group: currentGroup });
        setIsGroupModalOpen(false);
        setCurrentGroup(null);
        loadGroups();
    } catch (error) {
        console.error('Failed to update group:', error);
    }
};

const handleDeleteGroup = async (id: number) => {
    try {
        await window.api.db.deleteTransportGroup({ id });
        loadGroups();
    } catch (error) {
        console.error('Failed to delete group:', error);
    }
};


// ==================== Group Management Modal Component ====================
// Add this JSX before the closing </div> of the component (around line 726)

{
    isGroupModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-[#1e1e1e] rounded-3xl border border-white/10 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-8 py-6 border-b border-white/10 flex items-center justify-between">
                    <h2 className="text-2xl font-black text-white tracking-tight">Manage Transport Groups</h2>
                    <button onClick={() => { setIsGroupModalOpen(false); setCurrentGroup(null); }} className="p-2 text-white/40 hover:text-white transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    {/* Add New Group Section */}
                    <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                        <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest mb-4">Create New Group</h3>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-2">Group Name</label>
                                <input
                                    type="text"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500/30"
                                    placeholder="Cleaning, Security..."
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-2">Shift/Timing</label>
                                <select
                                    value={newGroup.shift}
                                    onChange={(e) => setNewGroup({ ...newGroup, shift: e.target.value })}
                                    className="w-full bg-[#1a1a1a] border border-white/5 rounded-xl py-3 px-4 text-sm font-bold text-white focus:outline-none focus:border-purple-500/30"
                                >
                                    <option value="9H">9H</option>
                                    <option value="11H">11H</option>
                                    <option value="15H">15H</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] font-black text-white/20 uppercase tracking-widest block mb-2">Active Days</label>
                                <div className="flex gap-1">
                                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                        const fields: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => setNewGroup({ ...newGroup, [fields[i]]: !newGroup[fields[i]] })}
                                                className={`flex-1 py-2 text-[10px] font-black rounded-lg transition-all ${newGroup[fields[i]] ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/20'}`}
                                            >
                                                {day}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={handleAddGroup}
                            className="mt-4 px-6 py-3 bg-purple-600 text-white font-black rounded-xl hover:bg-purple-700 transition-all active:scale-95"
                        >
                            <Plus className="w-4 h-4 inline mr-2" />
                            Add Group
                        </button>
                    </div>

                    {/* Existing Groups List */}
                    <div>
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest mb-4">Existing Groups</h3>
                        <div className="space-y-3">
                            {groups.map(group => (
                                <div key={group.id} className="bg-white/5 rounded-xl border border-white/10 p-4 flex items-center justify-between hover:bg-white/[0.07] transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-4">
                                            <span className="text-white font-black text-sm">{group.name}</span>
                                            <span className="px-3 py-1 bg-purple-600 text-white text-xs font-black rounded-lg">{group.shift}</span>
                                            <div className="flex gap-1">
                                                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => {
                                                    const fields: ('mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun')[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
                                                    return (
                                                        <span key={i} className={`text-[8px] font-black w-5 h-5 flex items-center justify-center rounded ${group[fields[i]] ? 'bg-purple-600 text-white' : 'bg-white/5 text-white/10'}`}>
                                                            {day}
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteGroup(group.id!)}
                                        className="p-2 text-red-400 hover:text-red-300 transition-colors hover:bg-red-500/10 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            {groups.length === 0 && (
                                <div className="text-center py-12 text-white/20 text-sm">
                                    No groups yet. Create one above!
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-white/10">
                    <button
                        onClick={() => { setIsGroupModalOpen(false); setCurrentGroup(null); }}
                        className="w-full py-4 bg-white/5 text-white/60 font-black rounded-2xl hover:bg-white/10 hover:text-white transition-all border border-white/5 tracking-widest uppercase text-xs"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    )
}
