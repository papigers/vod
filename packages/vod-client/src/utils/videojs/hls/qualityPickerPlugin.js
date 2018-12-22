import videojs from 'video.js';

const VjsMenuItem = videojs.getComponent('MenuItem');

class QualityMenuItem extends VjsMenuItem {
  handleClick() {
    super.handleClick();

    this.options_.qualitySwitchCallback(this.options_.id, this.options_.trackType);
  }
}

const VjsMenu = videojs.getComponent('Menu');

class QualityMenu extends VjsMenu {
  addItem(component) {
    super.addItem(component);

    component.on('click', () => {
      let children = this.children();

      for (var i = 0; i < children.length; i++) {
        var child = children[i];
        if (component !== child) {
          child.selected(false);
        }
      }
    });
  }
}

const VjsButton = videojs.getComponent('MenuButton');

let TRACK_CLASS = {
  video: 'vjs-icon-hd',
  audio: 'vjs-icon-cog',
  subtitle: 'vjs-icon-subtitles',
};

class QualityPickerButton extends VjsButton {
  createMenu() {
    var menu = new QualityMenu(this.player, this.options_);
    var menuItem;
    var options;
    for (var i = 0; i < this.options_.qualityList.length; i++) {
      var quality = this.options_.qualityList[i];
      var { qualitySwitchCallback, trackType } = this.options_;
      options = Object.assign({ qualitySwitchCallback, trackType }, quality, {
        selectable: true,
      });

      menuItem = new QualityMenuItem(this.player, options);
      menu.addItem(menuItem);
    }

    return menu;
  }

  buildCSSClass() {
    return `${
      TRACK_CLASS[this.options_.trackType]
    } vjs-quality-picker vjs-icon-placeholder ${super.buildCSSClass()}`;
  }
}

function qualityPickerPluginHLS() {
  var player = this;

  let SUPPORTED_TRACKS = ['video', 'audio', 'subtitle'];

  // On later versions `player.tech` is undefined before this...
  if (player.tech_) {
    player.tech_.on('loadedqualitydata', onQualityData);
  } else {
    player.ready(function() {
      player.tech_.on('loadedqualitydata', onQualityData);
    }, true);
  }

  function onQualityData(event, { qualityData, qualitySwitchCallback }) {
    for (var i = 0; i < SUPPORTED_TRACKS.length; i++) {
      var track = SUPPORTED_TRACKS[i];
      var name = track + 'PickerButton';
      // videojs.utils.toTitleCase
      name = name.charAt(0).toUpperCase() + name.slice(1);

      var qualityPickerButton = player.controlBar.getChild(name);
      if (qualityPickerButton) {
        qualityPickerButton.dispose();
        player.controlBar.removeChild(qualityPickerButton);
      }

      if (qualityData[track] && qualityData[track].length > 1) {
        qualityPickerButton = new QualityPickerButton(player, {
          name,
          qualityList: qualityData[track]
            .map(q => {
              return {
                ...q,
                label:
                  q.label === 'auto' ? 'Auto' : q.id >= 3 ? `${q.label} <sup>HD</sup>` : q.label,
              };
            })
            .sort((q1, q2) => q2.id - q1.id),
          qualitySwitchCallback,
          trackType: track,
        });

        player.controlBar.addChild(qualityPickerButton);

        player.controlBar
          .el()
          .insertBefore(
            player.controlBar.children()[player.controlBar.children().length - 1].el(),
            player.controlBar.playbackRateMenuButton.el().nextSibling,
          );
      }
    }
  }
}

const registerPlugin = videojs.registerPlugin || videojs.plugin;
registerPlugin('qualityPickerPlugin', qualityPickerPluginHLS);
