/**
 * The name of menu item that contains the action.
 */
var menuItemName = "Expand all conrefs/keyrefs";

/**
 * Application started.
 */
function applicationStarted(pluginWorkspaceAccess) {
	loadDitaTextResolverMethods(pluginWorkspaceAccess);

	menuContributor = {
			customizeAuthorPopUpMenu: function (popUp, authorAccess) {
				try {
					/*Create absolute reference*/
					mi = new Packages.javax.swing.JMenuItem(menuItemName);
					popUp.add(mi);
					actionPerfObj = {
							actionPerformed: function (e) {
								var documentController = authorAccess.getDocumentController();
								
									documentController.beginCompoundEdit();
									
									// Expand all conrefs/keyrefs from the document.
									expandConrefs(authorAccess, new Packages.java.util.HashSet());
									expandKrefs(authorAccess);

									documentController.endCompoundEdit();
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
 * Application closing.
 */
function applicationClosing(pluginWorkspaceAccess) {
}


/**
 * Expand conrefs from the current document.
 * 
 * @param authorAccess The access in author page.
 * @param Number of invalid conrefs, that can't be expanded.
 */
function expandConrefs(authorAccess, invalidConrefNodes) {
    var controller = authorAccess.getDocumentController();
    // Find conrefs and conkeyrefs
    var allNodes = null;
    try {
        allNodes = controller.findNodesByXPath("//*[@conref or @conkeyref]", true, true, true);
    }
    catch (e) {
        Packages.java.lang.System.err.println(e1);
    }
    
    var conrefNodes = excludeInvalidNodes(allNodes, invalidConrefNodes);
    var conrefNodesSize = conrefNodes.size();

    var root = controller.getAuthorDocumentNode().getRootElement();
    if (conrefNodes != null && (conrefNodesSize > 0)) {
    	for (var i = 0; i < conrefNodesSize; i++) {
    		var currentNode = conrefNodes.get(i);
            var replaceRoot = (currentNode.getStartOffset() <= root.getStartOffset()) && (currentNode.getEndOffset() >= root.getEndOffset());
            try {
            	var isError = false;
            	var contentNodes = currentNode.getContentNodes();
            	if (! contentNodes.isEmpty()) {
            		for (var j = 0; j < contentNodes.size(); j++) {
            			var currentContentNode = contentNodes. get (j);
            			if ("#error".equals(currentContentNode.getName())) {
            				isError = true;
            			}
            		}

            		// Modify only the valid conrefs.
            		if (! isError) {
            			if (replaceRoot) {
            				var startOffset = contentNodes.get(0).getStartOffset() + 1;
            				var endOffset = contentNodes.get(0).getEndOffset() - 1;
            				var fragment = controller.createDocumentFragment(startOffset, endOffset);
            				controller.replaceRoot(fragment);
            			} else {
            				authorAccess.getEditorAccess().setCaretPosition(currentNode.getStartOffset() + 1);
            				Packages.ro.sync.ecss.dita.DITAAccess.replaceConref(authorAccess);
            			}
            		} else {
            			invalidConrefNodes.add(currentNode);
            		}
            	} else {
            		invalidConrefNodes.add(currentNode);
            	}
            } catch (ex) {
            	invalidConrefNodes.add(currentNode);
                Packages.java.lang.System.err.println(ex);
            }
        }
        expandConrefs(authorAccess, invalidConrefNodes);
    }
}
    

/**
 * Expand the keyfs from the current document. The keyrefs from xrefs are changed with hrefs.
 */
function expandKrefs(authorAccess){
	var documentController = authorAccess.getDocumentController();
    if (resolver != null && activatedMethod != null && resolveReferenceMethod != null && deactivedMethod != null) {
        var keyrefNodes = null;
        try {
            keyrefNodes = documentController.findNodesByXPath("//*[@keyref]", true, true, true);
        }
        catch (e) {
            Packages.java.lang.System.err.println(e1);
        }
        
        if (keyrefNodes != null && keyrefNodes.length > 0) {
            try {
                activatedMethod.invoke(resolver, authorAccess);
                for (i = 0; i < keyrefNodes.length; i++) {
                	var currentNode = new JavaAdapter(Packages.ro.sync.ecss.extensions.api.node.AuthorElement, keyrefNodes[i]);
                	var classStringVal = "";
					var classVal = currentNode.getAttribute("class");
					if(classVal != null) {
						classStringVal = classVal.getValue();
					}
					if (classStringVal.contains(" topic/link ") || classStringVal.contains(" topic/xref ")) {
                		// Change 'keyrefs' with 'hrefs' on 'xref' and 'link' elements
                		var keyrefVal = currentNode.getAttribute("keyref");

                		var xmlBaseURL = currentNode.getXMLBaseURL();
                		var keys = Packages.ro.sync.ecss.dita.DITAAccess.getKeys(xmlBaseURL, 
                				Packages.ro.sync.ecss.dita.ContextKeyManager.getDefault());

                		var value = keyrefVal.getValue();
                		var keyInfo = keys.get(value);

                		if(keyInfo != null && keyInfo.getHrefLocation() != null) {
                			var hrefLocation = keyInfo.getHrefLocation();
                			var relativeVal = Packages.ro.sync.util.URLUtil.makeRelative(xmlBaseURL, hrefLocation);

                			documentController.removeAttribute("keyref", currentNode);
                			documentController.setAttribute("href", 
                					new Packages.ro.sync.ecss.extensions.api.node.AttrValue(relativeVal),
                					currentNode);
                		}
                    } else {
                    	// Insert the text from the reference over the current node.
                        resolved = resolveReferenceMethod.invoke(resolver, currentNode);
                        offset = keyrefNodes[i].getStartOffset();
                            	documentController.deleteNode(keyrefNodes[i]);
                            	documentController.insertText(offset, resolved);
                    }
                }
            }
            catch (e) {
                Packages.java.lang.System.err.println(e);
            }
            finally {
                try {
                    resolver.deactivated(authorAccess);
                }
                catch (e) {
                    Packages.java.lang.System.err.println(e);
                }
            }
        }
    }
}



function excludeInvalidNodes(allNodes, invalidNodes) {
	var toReturn = null;
	if(allNodes != null) {
		if(invalidNodes != null && !invalidNodes.isEmpty()) {
		var lenght = allNodes.length;
			toReturn = new Packages.java.util.ArrayList();
			for (var i = 0; i < lenght; i++) {
				var currentNode = allNodes[i];
				if(!invalidNodes.contains(currentNode)) {
					toReturn.add(currentNode);
				}
			}
		} else {
			toReturn = Packages.java.util.Arrays.asList(allNodes);
		}
	}
	return toReturn;
}



	/**
	 * Load the DitaLinkTextResolver class from the dita.jar 
	 * and store a instance and some methods as global variables. 
	 */
    function loadDitaTextResolverMethods(pluginWorkspaceAccess) {
    	var classLoader = null;
        try {
        	// Create the dita jar path.
            var frameworksPath = pluginWorkspaceAccess.getUtilAccess().expandEditorVariables("${frameworks}", null);
            var ditaJarPath = Packages.ro.sync.util.URLUtil.makeAbsolute(frameworksPath, "dita/dita.jar");
            var urls = Packages.java.lang.reflect.Array.newInstance(java.net.URL, 1);
            urls[0] = new java.net.URL(ditaJarPath);
            
            // Load classes from dita.jar
            classLoader = new Packages.java.net.URLClassLoader(urls, pluginWorkspaceAccess.getClass().getClassLoader());
            var ditaLinkTextResolverClass = classLoader.loadClass("ro.sync.ecss.extensions.dita.link.DitaLinkTextResolver");
            
            // Create a instance of DitaLinkTextResolver and get some methods.
            resolver = ditaLinkTextResolverClass.newInstance();
            activatedMethod = ditaLinkTextResolverClass.getDeclaredMethod("activated", Packages.java.lang.Class.forName("ro.sync.ecss.extensions.api.AuthorAccess"));
            deactivedMethod = ditaLinkTextResolverClass.getDeclaredMethod("deactivated",  Packages.java.lang.Class.forName("ro.sync.ecss.extensions.api.AuthorAccess"));
            resolveReferenceMethod = ditaLinkTextResolverClass.getDeclaredMethod("resolveReference",  Packages.java.lang.Class.forName("ro.sync.ecss.extensions.api.node.AuthorNode"));
        }
        catch (e) {
            Packages.java.lang.System.err.println(e);
        }
        finally {
            if (classLoader != null) {
                try {
                	classLoader.close();
                }
                catch (e) {
                    //Do nothing
                }
            }
        }
    }
    