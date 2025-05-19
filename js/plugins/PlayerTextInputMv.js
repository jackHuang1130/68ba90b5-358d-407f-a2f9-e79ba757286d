/*:
 * @plugindesc [RPG Maker MV] Player Text Input v2.2.0 (Desktop & Mobile)
 * @author Gamer Tool Studio
 *
 * @help
 * ------------------------------------------------------------------
 * 主要改動
 * 1. 行動裝置自動建立 <textarea> 觸發軟體鍵盤
 * 2. 同步輸入內容到插件邏輯，Enter/Done 即送出
 * 3. 視窗關閉時自動回收 textarea，避免殘留焦點
 * ------------------------------------------------------------------
 *
 * Plugin Commands:
 *   InputWithImage <variableId> <placeholderText> <actorImage> <actorIndex>
 *   InputBlank     <variableId> <placeholderText>
 *   DisplayResponse <variableId> <actorImage> <actorIndex>
 *
 * 其餘用法與 v2.1.0 相同
 * ------------------------------------------------------------------
 */

(function() {

    // -------------------------------------------------------------
    // 公用偵測
    // -------------------------------------------------------------
    var IS_MOBILE = Utils.isMobileDevice();   // ★★ 行動裝置判斷

    // -------------------------------------------------------------
    // Plugin Command 區：保持不變，只修 InputWithImage 的參數彈性
    // -------------------------------------------------------------
    var pluginCommands = {

        // ========= InputWithImage =========
        'InputWithImage': function(args) {
            var inputVariable = parseInt(args[0], 10) || 19;

            var placeholderText = "";
            var actorFaceImage   = "";
            var actorFaceIndex   = 0;

            if (args.length >= 4) {           // 四參：字串 + 圖檔 + index
                placeholderText = args.slice(1, args.length - 2).join(' ');
                actorFaceImage  = args[args.length - 2];
                actorFaceIndex  = parseInt(args[args.length - 1]) || 0;
            } else if (args.length === 3) {   // 三參：字串 + 圖檔
                placeholderText = args[1];
                actorFaceImage  = args[2];
            } else if (args.length === 2) {   // 兩參：只有字串
                placeholderText = args[1];
            } else {
                placeholderText = "Enter your message...";
            }

            $gameMessage.setFaceImage(actorFaceImage, actorFaceIndex);

            // === 啟動輸入流程 ===
            $gameMessage._isUserInputComplete = false;
            var scene = SceneManager._scene;
            if (scene instanceof Scene_Map) {
                var win = scene._messageWindow;
                if (win) {
                    win.prepareInputWindow(inputVariable, actorFaceImage, actorFaceIndex, placeholderText);
                    setTimeout(function(){ win.activateInput(); }, 100);
                }
            }
            $gameSystem._isWaitingForInput = true;
        },

        // ========= InputBlank =========
        'InputBlank': function(args) {
            var inputVariable   = parseInt(args[0], 10) || 19;
            var placeholderText = args.slice(1).join(' ') || "Enter your message...";

            $gameMessage.setFaceImage('', 0);
            $gameMessage._isUserInputComplete = false;

            var scene = SceneManager._scene;
            if (scene instanceof Scene_Map) {
                var win = scene._messageWindow;
                if (win) {
                    win.prepareInputWindow(inputVariable, '', 0, placeholderText);
                    setTimeout(function(){ win.activateInput(); }, 100);
                }
            }
            $gameSystem._isWaitingForInput = true;
        },

        // ========= DisplayResponse =========
        'DisplayResponse': function(args) {
            var vid   = parseInt(args[0], 10);
            var face  = args[1] || '';
            var idx   = parseInt(args[2], 10) || 0;
            var text  = $gameVariables.value(vid) || "No text found";

            $gameMessage.setFaceImage(face, idx);
            $gameMessage.add(text);
        }
    };

    // -------------------------------------------------------------
    // 事件等待邏輯（原樣）
    // -------------------------------------------------------------
    var _GIntPluginCmd = Game_Interpreter.prototype.pluginCommand;
    Game_Interpreter.prototype.pluginCommand = function(cmd, args) {
        _GIntPluginCmd.call(this, cmd, args);
        if (pluginCommands[cmd]) pluginCommands[cmd](args);
    };
    var _GIntUpdateWait = Game_Interpreter.prototype.updateWaitMode;
    Game_Interpreter.prototype.updateWaitMode = function() {
        if ($gameSystem._isWaitingForInput) return !$gameMessage._isUserInputComplete;
        return _GIntUpdateWait.call(this);
    };

    // -------------------------------------------------------------
    // Window_Message 擴充
    // -------------------------------------------------------------
    Window_Message.prototype.prepareInputWindow = function(vId, face, idx, placeholder) {
        this._inputVariable      = vId;
        this._actorFaceImage     = face;
        this._actorFaceImageIndex= idx;
        this._inputLines         = [''];
        this._inputActive        = true;
        this._placeholderText    = placeholder;
        this.open();
        this.refreshInputWindow();
        $gameMessage._isUserInputComplete = false;
    };

    // === 行動裝置專用 textarea ===
    Window_Message.prototype._createMobileTextarea = function(ph) {           // ★★
        var ta = document.createElement('textarea');
        ta.id           = 'gts-input';
        ta.placeholder  = ph || '';
        ta.style.position   = 'absolute';
        ta.style.opacity    = 0;        // 完全隱形
        ta.style.left       = '-1000px';// 螢幕外
        ta.style.top        = '0';
        ta.style.width      = '1px';
        ta.style.height     = '1px';
        document.body.appendChild(ta);
        return ta;
    };

    // === 啟動輸入 ===
    Window_Message.prototype.activateInput = function() {
        if (!this._inputActive) return;

        if (IS_MOBILE) {                                             // ★★
            // 建立並聚焦 textarea
            this._mobileTA = this._createMobileTextarea(this._placeholderText);
            this._mobileTA.value = '';
            this._mobileTA.focus();

            // 文字同步
            this._boundMobileInput = this._handleMobileInput.bind(this);
            this._mobileTA.addEventListener('input', this._boundMobileInput);
            this._mobileTA.addEventListener('keydown', this._boundMobileInput);
        } else {
            // 桌機：原本的 keydown 流程
            this._origKeyMap      = Object.assign({}, Input.keyMapper);
            this._overrideKeyMapperForTextInput();
            this._boundHandleKey  = this.handleDesktopKey.bind(this);
            document.addEventListener('keydown', this._boundHandleKey);
        }
        this.refreshInputWindow();
    };

    // === 行動裝置 input 處理 ===
    Window_Message.prototype._handleMobileInput = function(e) {               // ★★
        var val = this._mobileTA.value;
        if (e.type === 'keydown' && e.key === 'Enter') {   // Done
            e.preventDefault();
            this._mobileTA.blur();
            this._inputLines = [val.replace(/\n/g, '')];
            this.processInput();
            return;
        }
        this._inputLines = [val.replace(/\n/g, '')];
        this.refreshInputWindow();
    };

    // === 桌機 keydown ===
    Window_Message.prototype.handleDesktopKey = function(e) {
        if (!this._inputActive || !this.isOpen()) return;
        var lineIdx = this._inputLines.length - 1;
        var curLine = this._inputLines[lineIdx];

        if (e.key === 'Enter') { this.processInput(); e.preventDefault(); }
        else if (e.key === 'Backspace') {
            if (curLine.length) this._inputLines[lineIdx] = curLine.slice(0,-1);
            this.refreshInputWindow();
        }
        else if (e.key === 'Escape') { this._inputLines=['']; this.deactivateInput(); e.preventDefault(); }
        else if (e.key.length === 1) {
            if (curLine.length < 40) this._inputLines[lineIdx]+=e.key;
            this.refreshInputWindow();
        }
        if (e.key===' '||e.key==='z') { e.stopPropagation(); e.preventDefault(); }
    };

    // === 提交 ===
    Window_Message.prototype.processInput = function() {
        var text = this._inputLines.join('').trim();
        $gameVariables.setValue(this._inputVariable, isNaN(Number(text)) ? text : Number(text));
        $gameMessage._isUserInputComplete = true;
        $gameSystem._isWaitingForInput    = false;
        this.deactivateInput();
        this.close();
    };

    // === 關閉輸入 ===
    Window_Message.prototype.deactivateInput = function() {
        this._inputActive = false;

        if (IS_MOBILE && this._mobileTA) {                                  // ★★
            this._mobileTA.removeEventListener('input', this._boundMobileInput);
            this._mobileTA.removeEventListener('keydown', this._boundMobileInput);
            document.body.removeChild(this._mobileTA);
            this._mobileTA = null;
        } else if (!IS_MOBILE) {
            document.removeEventListener('keydown', this._boundHandleKey);
            Input.keyMapper = this._origKeyMap;
        }
    };

    // === 繪圖 ===
    Window_Message.prototype.refreshInputWindow = function() {
        if (!this._inputLines) return;
        this.contents.clear();

        // Face
        var faceW = 0, startX = 0, startY = 0;
        if (this._actorFaceImage) {
            this.drawFace(this._actorFaceImage, this._actorFaceImageIndex, 0, 0);
            faceW  = Window_Base._faceWidth;
            startX = faceW + 10;
        }

        // Text
        var str = this._inputLines.join('');
        if (!str) { this.changeTextColor(this.textColor(7)); str = this._placeholderText; }
        this.contents.drawText(str, startX, startY, this.contents.width - startX - 10, this.lineHeight());
        this.resetTextColor();
    };

    // === KeyMapper 覆寫（桌機） ===
    Window_Message.prototype._overrideKeyMapperForTextInput = function() {
        Input.keyMapper[32] = 'space';
        Input.keyMapper[90] = 'z';
        Input.keyMapper[88] = 'x';
        Input.keyMapper[87] = 'w';
        Input.keyMapper[80] = 'p';
    };

})();
