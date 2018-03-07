/**
 * The name of menu item that contains the action.
 */
var menuItemName = "Expand all conrefs/keyrefs";

/**
 * Aplication started.
 */
function applicationStarted(pluginWorkspaceAccess) {
    menuContributor = {
        customizeAuthorPopUpMenu: function (popUp, authorAccess) {
            try {
                /*Create absolute reference*/
                mi = new Packages.javax.swing.JMenuItem(menuItemName);
                popUp.add(mi);
                actionPerfObj = {
                    actionPerformed: function (e) {
                        var thread = java.lang.Thread(function () {
                            try {
                                var documentController = authorAccess.getDocumentController();
                                javax.swing.SwingUtilities.invokeAndWait(function () {
                                    documentController.beginCompoundEdit();
                                });
                                // Expand all conrefs/keyrefs from the document.
                                expandRefs(authorAccess);
                                
                                javax.swing.SwingUtilities.invokeAndWait(function () {
                                    documentController.endCompoundEdit();
                                });
                            }
                            catch (ex) {
                                Packages.java.lang.System.err.println(ex);
                            }
                        });
                        thread.start()
                    }
                }
                mi.addActionListener(new JavaAdapter(Packages.java.awt.event.ActionListener, actionPerfObj));
            }
            catch (e1) {
                Packages.java.lang.System.err.println(e1);
            }
        }
    }
    
    pluginWorkspaceAccess.addMenusAndToolbarsContributorCustomizer(new Packages.ro.sync.exml.workspace.api.standalone.actions.MenusAndToolbarsContributorCustomizer(menuContributor));
}

/**
 * Aplication closing.
 */
function applicationClosing(pluginWorkspaceAccess) {
}

/**
 *
 */
function expandRefs(authorAccess) {
    allNodes = authorAccess.getDocumentController().findNodesByXPath("//*[@conref or @conkeyref]", true, true, true);
    if (allNodes != null) {
        for (i = 0; i < allNodes.length; i++) {
            try {
                javax.swing.SwingUtilities.invokeAndWait(function () {
                    authorAccess.getEditorAccess().setCaretPosition(allNodes[i].getStartOffset() + 1);
                    Packages.ro.sync.ecss.dita.DITAAccess.replaceConref(authorAccess);
                });
            }
            catch (ex) {
                Packages.java.lang.System.err.println(ex);
            }
        }
    }
    //Resolve also keyrefs
    keyrefNodes = authorAccess.getDocumentController().findNodesByXPath("//*[@keyref]", true, true, true);
    if (keyrefNodes != null) {
        if (keyrefNodes.length > 0) {
            resolver = new Packages.ro.sync.ecss.extensions.dita.link.DitaLinkTextResolver();
            resolver.activated(authorAccess);
            for (i = 0; i < keyrefNodes.length; i++) {
                resolved = resolver.resolveReference(keyrefNodes[i]);
                offset = keyrefNodes[i].getStartOffset();
                try {
                    javax.swing.SwingUtilities.invokeAndWait(function () {
                        authorAccess.getDocumentController().deleteNode(keyrefNodes[i]);
                        authorAccess.getDocumentController().insertText(offset, resolved);
                    });
                }
                catch (ex) {
                    Packages.java.lang.System.err.println(ex);
                }
            }
            resolver.deactivated(authorAccess);
        }
    }
}