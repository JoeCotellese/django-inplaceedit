(function($) {
    $.fn.inplaceeditform = function (opts, callback) {
        var defaults = {"getFieldUrl": "/implaceeditform/get_field/",
            "saveURL": "/inplaceeditform/save/",
            "successText": "Successfully saved"};
        var enabled = true;
        opts = $.extend(defaults, opts || {});
        this.each(function () {
            $(this).click(function() {
                if(!enabled) {
                    return true;
                }
                return false;
            });

            $(this).mouseenter(function() {
                if(!enabled) {
                    return false;
                }
                $(this).addClass("edit_over");
            });

            $(this).mouseleave(function() {
                $(this).removeClass("edit_over");
            });

            $(this).dblclick(function () {
                if(!enabled) {
                    return false;
                }
                $(this).data("inplace_enabled")
                var data = getDataToRequest($(this).find("span.config"));
                data += "&__widget_height=" + $(this).innerHeight() + "px" + "&__widget_width=" + $(this).innerWidth() + "px";
                var _this = $(this);
                $.ajax({
                data: data,
                url: opts.getFieldUrl,
                type: "GET",
                async:true,
                dataType: 'json',
                success: function(response) {
                    if (response == null) {
                        alert("The server is down");
                    }
                    else if (response.errors) {
                        alert(response.errors);
                    }
                    else {
                        _this.hide();
                        _this.addClass("inplaceHide");
                        var tags = $(response.field_render);
                        $(response.field_render).insertAfter(_this);

                        var head = $("head")[0];
                        try {
                            var medias = $(response.field_media_render);
                            $.map(medias, function(media){
                               loadjscssfile(media);
                            });
                        }catch(err){
                        }
                        var links_parents = _this.next().parents("a");
                        if(links_parents.length > 0) {
                            $.map(links_parents, function (link, i) {
                                var link = $(link);
                                var href = link.attr("href");
                                link.attr("hrefinplaceedit", href);
                                link.addClass("linkInplaceEdit");
                                link.removeAttr("href");
                            });
                        }
                        _this.next().find(".cancel").click(inplaceCancel);
                        _this.next().find(".apply").click(inplaceApply);
                        _this.next().find(".applyFile").click(inplaceApplyUpload);
                    }
                }});
            });

            function revertlinkInplaceEdit(links_parents) {
                $.map(links_parents, function (link, i) {
                    var link = $(link);
                    var href = link.attr("hrefinplaceedit");
                    link.attr("href", href);
                    link.removeClass("linkInplaceEdit");
                    link.removeAttr("hrefinplaceedit");
                });
            }

            function inplaceCancel() {
                revertlinkInplaceEdit($(this).parents("a.linkInplaceEdit"));
                $(this).parent().prev().fadeIn();
                $(this).parent().prev().removeClass("inplaceHide");
                var cancelFinish = $(this).data("cancelFinish");
                if (cancelFinish){
                    cancelFinish();
                }
                $(this).parent().remove();
                return false;
            }

            function replaceAll(txt, replace, with_this) {
                return txt.replace(new RegExp(replace, "g"), with_this);
            }

            function inplaceApplySuccess(response){
                if (typeof response == "string") {
                    if ($.browser.msie) {
                        response = replaceAll(response, "'\\\\\"", "'");
                        response = replaceAll(response, "\"'", "'"); 
                    }
                    response = JSON.parse(response);
                }
                revertlinkInplaceEdit($(this.form).parents("a.linkInplaceEdit"));
                var _this = this.context;
                var form = this.form;
                var inplaceedit_conf = this.inplaceedit_conf;
                if (response == null) {
                    alert("The server is down");
                }
                else if (response.errors) {
                    form.animate({opacity: 1});
                    form.prepend("<ul class='errors'><li>" + response.errors + "</li></ul>");
                }
                else {
                    _this.parent().fadeOut();
                    _this.fadeIn();
                    form.removeClass("inplaceeditformsaving");
                    var inplace_span = inplaceedit_conf.parents(".inplaceedit");
                    var config = inplace_span.find("span.config").html();
                    inplace_span.html(response.value + "<span class='config' style='display:none;'>" + config + "</span>");
                    var success_message = $("<ul class='success'><li>" + opts.successText + "</li></ul>")
                    inplace_span.prepend(success_message);
                    setTimeout(function(){
                        success_message.fadeOut(function(){
                            $(this).remove();
                        });
                    }, 2000);
                    inplace_span.show();
                    inplace_span.removeClass("inplaceHide");
                    var applyFinish = $(_this).data("applyFinish");
                    if (applyFinish){
                        applyFinish(_this);
                    }
                    _this.parent().remove();
                }
            }

            function bind(func, _this) {
                return function() {return func.apply(_this, arguments)}
            }

            function inplaceApply() {
                var form = $(this).parents("form.inplaceeditform");
                form.animate({opacity: 0.1});
                form.find("ul.errors").fadeOut(function(){$(this).remove();});
                var inplaceedit_conf = form.prev().find("span.config");
                var data = getDataToRequest(inplaceedit_conf);
                var field_id = form.find("span.field_id").html();
                var getValue = $(this).data("getValue"); // A hook
                if (getValue != null) {
                   var value = getValue(form, field_id);
                }
                else {
                    var value = form.find("#"+field_id).val();
                }
                data += "&value=" + encodeURIComponent($.toJSON(value));
                $.ajax({
                    data: data,
                    url:  opts.saveURL,
                    type: "POST",
                    async: true,
                    dataType: 'text',
                    success: bind(inplaceApplySuccess, {"context": $(this),
                                                        "form": form,
                                                        "inplaceedit_conf": inplaceedit_conf})});
                return false;
            }

            function inplaceApplyUpload() {
                var form = $(this).parents("form.inplaceeditform");
                form.animate({opacity: 0.1});
                form.find("ul.errors").fadeOut(function(){$(this).remove();});
                var inplaceedit_conf = form.prev().find("span.config");
                var data = getDataToRequestUpload(inplaceedit_conf);
                var field_id = form.find("span.field_id").html();
                var getValue = $(this).data("getValue"); // A hook
                if (getValue != null) {
                    var value = getValue(form, field_id);
                }
                else {
                    var value = form.find("#"+field_id).val();
                }
                data["value"] = encodeURIComponent($.toJSON(value));
                var _this = $(this);

                form.ajaxSubmit({
                        url: opts.saveURL,
                        data: data,
                        async: true,
                        type: "POST",
                        dataType: "application/json",
                        success:bind(inplaceApplySuccess, {"context": $(this),
                                                           "form": form,
                                                           "inplaceedit_conf": inplaceedit_conf})});
                return false;
            }

            function getDataToRequest(inplaceedit_conf) {
                var dataToRequest = "";
                var settings = inplaceedit_conf.find("span");
                $.map(settings, function (setting, i) {
                    var setting = $(setting);
                    var data = "&";
                    if (i == 0) {
                        data = "";
                    }
                    var key = setting.attr("class");
                    var value = setting.html();
                    data = data + key + "=" + value;
                    dataToRequest += data;
                });
                return dataToRequest;
            }

            function getDataToRequestUpload(inplaceedit_conf) {
                var dataToRequest = {};
                var settings = inplaceedit_conf.find("span");
                $.map(settings, function (setting, i) {
                    var setting = $(setting);
                    var key = setting.attr("class");
                    var value = setting.html();
                    dataToRequest[key] = value;
                });
                return dataToRequest;
            }

            function loadjscssfile(media){
                if (media.tagName=="SCRIPT"){ //if filename is a external JavaScript file
                    var fileref = document.createElement('script');
                    fileref.setAttribute("type","text/javascript");
                    if(media.src != null && media.src != "" ){
                        fileref.setAttribute("src", media.src);
                    } else {
                        appendChild(fileref, media.innerHTML);
                    }
                }
                else if (media.tagName=="LINK" && media.type == "text/css"){ //if filename is an external CSS file
                    var fileref=document.createElement("link");
                    fileref.setAttribute("rel", "stylesheet");
                    fileref.setAttribute("type", "text/css");
                    fileref.setAttribute("href", media.href);
                }

                if (typeof fileref!="undefined") {
                    document.getElementsByTagName("head")[0].appendChild(fileref);
                }
            }
            function appendChild(node, text) {
                if (null == node.canHaveChildren || node.canHaveChildren) {
                    node.appendChild(document.createTextNode(text));
                } else {
                    node.text = text;
                }
            } 
    });
    return {
        enable: function () {
            enabled = true;
        },
        disable: function () {
            enabled = false;
        }
    };
 }
})(jQuery);
