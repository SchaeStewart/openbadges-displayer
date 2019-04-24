import { Component, Prop, State } from "@stencil/core";
import { unbakeBadge } from "../../utils/utils";

// https://media.us.badgr.io/uploads/badges/assertion-fK9hiougS7SsVaSoCw1cZg.png

@Component({
  tag: "openbadge-displayer",
  //   styleUrl: "my-component.css",
  shadow: true
})
export class OpenBadge {
  /**
   * The openbadge image
   */
  @Prop() src: string;

  @State() badge: object;

  async componentDidLoad() {
    this.badge = await unbakeBadge(this.src);
  }

  private async getBadgeInformation(badge: any) {
    const badgeData = await fetch(badge.badge).then(data => data.json());
    console.log(badgeData);
    return badgeData;
  }

  render() {
    return (
      <div>
        <img src={this.src} />
        <span>{this.badge}</span>
        <span>{this.badge && this.getBadgeInformation(this.badge)}</span>
        {/* TODO: pickup here. what data to get from badge */}
      </div>
    );
  }
}
